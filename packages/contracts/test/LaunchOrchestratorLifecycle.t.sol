// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {TestBase} from "./helpers/TestBase.sol";
import {LaunchOrchestrator} from "../src/LaunchOrchestrator.sol";
import {LaunchFactory} from "../src/LaunchFactory.sol";
import {OrchestratorDeployer} from "../src/OrchestratorDeployer.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {
    LaunchParams,
    PlatformFeeConfig,
    TokenSource,
    LaunchState,
    TokenCreationParams
} from "../src/types/LaunchTypes.sol";
import {
    InvalidState,
    OnlyOperator,
    TokenNotCreated,
    TokenAlreadyCreated,
    InvalidTokenSource
} from "../src/errors/LaunchErrors.sol";

/// @notice End-to-end lifecycle tests for LaunchOrchestrator
contract LaunchOrchestratorLifecycleTest is TestBase {
    LaunchFactory public launchFactory;
    OrchestratorDeployer public deployer;
    TokenFactory public tokenFactory;
    address public mockPostAuctionHandler = makeAddr("postAuctionHandler");

    function setUp() public override {
        super.setUp();

        tokenFactory = new TokenFactory(TOKEN_CREATION_FEE, platformFeeRecipient);
        deployer = new OrchestratorDeployer();

        PlatformFeeConfig memory feeConfig_ = createDefaultPlatformFeeConfig();

        launchFactory = new LaunchFactory(
            platformAdmin,
            feeConfig_,
            address(deployer),
            address(ccaFactory),
            mockPostAuctionHandler,
            address(tokenFactory)
        );
    }

    // ============================================
    // HAPPY PATH: SETUP → FINALIZED → AUCTION_ENDED → DISTRIBUTED
    // ============================================

    function test_fullLifecycle_existingBalance() public {
        LaunchParams memory params = createDefaultLaunchParams();
        // Disable liquidity for simpler test
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        // 1. SETUP: Fund and finalize
        auctionToken.mint(orchAddr, AUCTION_TOKEN_AMOUNT);

        vm.prank(operator);
        orch.finalizeSetup();
        assertEq(uint8(orch.state()), uint8(LaunchState.FINALIZED));

        // 2. Simulate auction with bids
        address ccaAddr = orch.cca();
        uint256 raised = 500_000e6;
        simulateAuctionWithBids(ccaAddr, raised, 5e5);

        // 3. Settle auction
        advanceToAuctionEnd(orch.auctionEndBlock());
        vm.prank(operator);
        orch.settleAuction();
        assertEq(uint8(orch.state()), uint8(LaunchState.AUCTION_ENDED));
        assertEq(orch.totalRaised(), raised);

        // 4. Distribute
        uint256 treasuryBefore = paymentToken.balanceOf(treasury);
        uint256 feeBefore = paymentToken.balanceOf(platformFeeRecipient);

        vm.prank(operator);
        orch.processDistribution();
        assertEq(uint8(orch.state()), uint8(LaunchState.DISTRIBUTED));

        // Verify fee: 5% of 500k = 25k
        uint256 expectedFee = (raised * SALE_FEE_BPS) / 10_000;
        assertEq(paymentToken.balanceOf(platformFeeRecipient) - feeBefore, expectedFee);

        // Verify treasury gets the rest (no liquidity)
        uint256 expectedTreasury = raised - expectedFee;
        assertEq(paymentToken.balanceOf(treasury) - treasuryBefore, expectedTreasury);
    }

    // ============================================
    // FAILURE PATH: SETUP → FINALIZED → AUCTION_FAILED
    // ============================================

    function test_fullLifecycle_auctionFailed() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        auctionToken.mint(orchAddr, AUCTION_TOKEN_AMOUNT);

        vm.prank(operator);
        orch.finalizeSetup();

        // No bids — settle should result in AUCTION_FAILED
        advanceToAuctionEnd(orch.auctionEndBlock());

        vm.prank(operator);
        orch.settleAuction();

        assertEq(uint8(orch.state()), uint8(LaunchState.AUCTION_FAILED));
        // Terminal state — cannot proceed
    }

    // ============================================
    // CANCEL PATH: SETUP → CANCELLED
    // ============================================

    function test_fullLifecycle_cancel() public {
        LaunchParams memory params = createDefaultLaunchParams();

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        // Fund and then cancel
        uint256 totalTokens = AUCTION_TOKEN_AMOUNT + LIQUIDITY_TOKEN_AMOUNT;
        auctionToken.mint(orchAddr, totalTokens);

        vm.prank(operator);
        orch.cancel();

        assertEq(uint8(orch.state()), uint8(LaunchState.CANCELLED));
        assertEq(auctionToken.balanceOf(treasury), totalTokens);
        assertEq(auctionToken.balanceOf(orchAddr), 0);
    }

    // ============================================
    // TOKEN SOURCE: EXISTING_TRANSFER_FROM
    // ============================================

    function test_fullLifecycle_transferFrom() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.tokenSource = TokenSource.EXISTING_TRANSFER_FROM;
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        // Operator holds the tokens and approves
        auctionToken.mint(operator, AUCTION_TOKEN_AMOUNT);
        vm.prank(operator);
        auctionToken.approve(orchAddr, AUCTION_TOKEN_AMOUNT);

        vm.prank(operator);
        orch.finalizeSetup();
        assertEq(uint8(orch.state()), uint8(LaunchState.FINALIZED));
        assertEq(auctionToken.balanceOf(operator), 0); // pulled from operator
    }

    // ============================================
    // TOKEN SOURCE: CREATE_NEW
    // ============================================

    function test_fullLifecycle_createNew() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.tokenSource = TokenSource.CREATE_NEW;
        params.token = address(0); // will be set by createToken()
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        // Step 1: Create token
        TokenCreationParams memory tokenParams = TokenCreationParams({
            name: "Launch Token", symbol: "LT", decimals: 18, initialSupply: 0, initialHolder: address(0)
        });

        vm.deal(operator, 1 ether);
        vm.prank(operator);
        orch.createToken{value: TOKEN_CREATION_FEE}(tokenParams);

        address createdToken = orch.token();
        assertTrue(createdToken != address(0), "Token should be created");

        // Step 2: Finalize — this should mint tokens
        vm.prank(operator);
        orch.finalizeSetup();
        assertEq(uint8(orch.state()), uint8(LaunchState.FINALIZED));
    }

    function test_createToken_revertsNonOperator() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.tokenSource = TokenSource.CREATE_NEW;
        params.token = address(0);

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        TokenCreationParams memory tokenParams =
            TokenCreationParams({name: "LT", symbol: "LT", decimals: 18, initialSupply: 0, initialHolder: address(0)});

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(OnlyOperator.selector, user1, operator));
        orch.createToken{value: TOKEN_CREATION_FEE}(tokenParams);
    }

    function test_createToken_revertsWrongSource() public {
        // Default params use EXISTING_BALANCE
        LaunchOrchestrator orch = orchestrator();

        vm.prank(operator);
        vm.expectRevert(InvalidTokenSource.selector);
        orch.createToken(
            TokenCreationParams({name: "LT", symbol: "LT", decimals: 18, initialSupply: 0, initialHolder: address(0)})
        );
    }

    function test_createToken_revertsAlreadyCreated() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.tokenSource = TokenSource.CREATE_NEW;
        params.token = address(0);

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        TokenCreationParams memory tokenParams =
            TokenCreationParams({name: "LT", symbol: "LT", decimals: 18, initialSupply: 0, initialHolder: address(0)});

        vm.deal(operator, 2 ether);
        vm.prank(operator);
        orch.createToken{value: TOKEN_CREATION_FEE}(tokenParams);

        // Try again — already created
        vm.prank(operator);
        vm.expectRevert(TokenAlreadyCreated.selector);
        orch.createToken{value: TOKEN_CREATION_FEE}(tokenParams);
    }

    function test_createNew_finalizeRevertsIfTokenNotCreated() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.tokenSource = TokenSource.CREATE_NEW;
        params.token = address(0);
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        // Skip createToken — go straight to finalize
        vm.prank(operator);
        vm.expectRevert(TokenNotCreated.selector);
        orch.finalizeSetup();
    }

    // ============================================
    // INVALID STATE TRANSITIONS
    // ============================================

    function test_cannotSettleFromSetup() public {
        LaunchParams memory params = createDefaultLaunchParams();
        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.SETUP, LaunchState.FINALIZED));
        orch.settleAuction();
    }

    function test_cannotDistributeFromFinalized() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        auctionToken.mint(orchAddr, AUCTION_TOKEN_AMOUNT);
        vm.prank(operator);
        orch.finalizeSetup();

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.FINALIZED, LaunchState.AUCTION_ENDED));
        orch.processDistribution();
    }

    function test_cannotCancelFromFinalized() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        auctionToken.mint(orchAddr, AUCTION_TOKEN_AMOUNT);
        vm.prank(operator);
        orch.finalizeSetup();

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.FINALIZED, LaunchState.SETUP));
        orch.cancel();
    }

    function test_cannotFinalizeFromDistributed() public {
        LaunchOrchestrator orch = _createFullDistributedLaunch();

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.DISTRIBUTED, LaunchState.SETUP));
        orch.finalizeSetup();
    }

    // ============================================
    // OPERATOR TRANSFER DURING LIFECYCLE
    // ============================================

    function test_operatorTransferMidLifecycle() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);

        auctionToken.mint(orchAddr, AUCTION_TOKEN_AMOUNT);

        // Transfer operator before finalize
        vm.prank(operator);
        orch.transferOperator(user1);
        vm.prank(user1);
        orch.acceptOperator();

        // New operator can finalize
        vm.prank(user1);
        orch.finalizeSetup();
        assertEq(uint8(orch.state()), uint8(LaunchState.FINALIZED));
    }

    // ============================================
    // MULTIPLE LAUNCHES INDEPENDENT
    // ============================================

    function test_multipleLaunchesIndependent() public {
        LaunchParams memory params1 = createDefaultLaunchParams();
        params1.liquidityConfig.enabled = false;
        params1.tokenAllocation.liquidityTokenAmount = 0;

        LaunchParams memory params2 = createDefaultLaunchParams();
        params2.liquidityConfig.enabled = false;
        params2.tokenAllocation.liquidityTokenAmount = 0;

        (, address orch1Addr) = launchFactory.createLaunch(params1);
        (, address orch2Addr) = launchFactory.createLaunch(params2);

        LaunchOrchestrator orch1 = LaunchOrchestrator(orch1Addr);
        LaunchOrchestrator orch2 = LaunchOrchestrator(orch2Addr);

        // Cancel launch 1
        vm.prank(operator);
        orch1.cancel();
        assertEq(uint8(orch1.state()), uint8(LaunchState.CANCELLED));

        // Launch 2 still in SETUP — unaffected
        assertEq(uint8(orch2.state()), uint8(LaunchState.SETUP));

        // Finalize launch 2
        auctionToken.mint(orch2Addr, AUCTION_TOKEN_AMOUNT);
        vm.prank(operator);
        orch2.finalizeSetup();
        assertEq(uint8(orch2.state()), uint8(LaunchState.FINALIZED));
    }

    // ============================================
    // HELPERS
    // ============================================

    function orchestrator() internal returns (LaunchOrchestrator) {
        LaunchParams memory params = createDefaultLaunchParams();
        (, address orchAddr) = launchFactory.createLaunch(params);
        return LaunchOrchestrator(orchAddr);
    }

    function _createFullDistributedLaunch() internal returns (LaunchOrchestrator orch) {
        LaunchParams memory params = createDefaultLaunchParams();
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;

        (, address orchAddr) = launchFactory.createLaunch(params);
        orch = LaunchOrchestrator(orchAddr);

        auctionToken.mint(orchAddr, AUCTION_TOKEN_AMOUNT);

        vm.prank(operator);
        orch.finalizeSetup();

        address ccaAddr = orch.cca();
        simulateAuctionWithBids(ccaAddr, 500_000e6, 5e5);

        advanceToAuctionEnd(orch.auctionEndBlock());

        vm.prank(operator);
        orch.settleAuction();

        vm.prank(operator);
        orch.processDistribution();
    }
}
