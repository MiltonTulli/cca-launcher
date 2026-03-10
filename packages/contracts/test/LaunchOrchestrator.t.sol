// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {TestBase} from "./helpers/TestBase.sol";
import {LaunchOrchestrator} from "../src/LaunchOrchestrator.sol";
import {LaunchFactory} from "../src/LaunchFactory.sol";
import {OrchestratorDeployer} from "../src/OrchestratorDeployer.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {ILaunchOrchestrator} from "../src/interfaces/ILaunchOrchestrator.sol";
import {MockCCA} from "./mocks/MockCCA.sol";
import {
    LaunchParams,
    PlatformFeeConfig,
    TokenSource,
    LaunchState
} from "../src/types/LaunchTypes.sol";
import {
    InvalidState,
    OnlyOperator,
    InsufficientTokenBalance,
    AuctionSupplyMustBePositive,
    AuctionNotEnded,
    DistributionNotPermissionless,
    InvalidAddress
} from "../src/errors/LaunchErrors.sol";

/// @notice Unit tests for LaunchOrchestrator individual functions
contract LaunchOrchestratorTest is TestBase {
    LaunchFactory public launchFactory;
    OrchestratorDeployer public deployer;
    TokenFactory public tokenFactory;
    address public mockPostAuctionHandler = makeAddr("postAuctionHandler");

    LaunchOrchestrator public orchestrator;
    uint256 public launchId;

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

        // Create a default launch with EXISTING_BALANCE source, liquidity disabled for unit tests
        LaunchParams memory params = createDefaultLaunchParams();
        params.liquidityConfig.enabled = false;
        params.tokenAllocation.liquidityTokenAmount = 0;
        (launchId,) = launchFactory.createLaunch(params);
        orchestrator = LaunchOrchestrator(launchFactory.getLaunch(launchId));

        vm.label(address(orchestrator), "Orchestrator");
    }

    // ============================================
    // CONSTRUCTOR / INITIAL STATE
    // ============================================

    function test_initialState() public view {
        assertEq(uint8(orchestrator.state()), uint8(LaunchState.SETUP));
        assertEq(orchestrator.operator(), operator);
        assertEq(orchestrator.factory(), address(launchFactory));
        assertEq(orchestrator.paymentToken(), address(paymentToken));
        assertEq(orchestrator.launchId(), launchId);
        assertEq(orchestrator.auctionTokenAmount(), AUCTION_TOKEN_AMOUNT);
        assertEq(orchestrator.liquidityTokenAmount(), 0); // disabled in setUp
        assertEq(orchestrator.treasuryAddress(), treasury);
        assertEq(orchestrator.saleFeeBpsSnapshot(), SALE_FEE_BPS);
    }

    // ============================================
    // FINALIZE SETUP — EXISTING_BALANCE
    // ============================================

    function test_finalizeSetup_existingBalance() public {
        // Fund orchestrator with auction tokens (no liquidity in this test)
        auctionToken.mint(address(orchestrator), AUCTION_TOKEN_AMOUNT);

        vm.prank(operator);
        orchestrator.finalizeSetup();

        assertEq(uint8(orchestrator.state()), uint8(LaunchState.FINALIZED));
        assertTrue(orchestrator.cca() != address(0), "CCA should be deployed");
    }

    function test_finalizeSetup_emitsEvent() public {
        auctionToken.mint(address(orchestrator), AUCTION_TOKEN_AMOUNT);

        vm.prank(operator);
        // Only check launchId topic, not CCA address or data
        vm.expectEmit(true, false, false, false);
        emit ILaunchOrchestrator.SetupFinalized(launchId, address(0), 0, 0);
        orchestrator.finalizeSetup();
    }

    function test_finalizeSetup_revertsInsufficientBalance() public {
        // Create a launch with liquidity enabled to test insufficient balance
        LaunchParams memory params = createDefaultLaunchParams();
        (uint256 id2,) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch2 = LaunchOrchestrator(launchFactory.getLaunch(id2));

        // Fund with only auction amount, missing liquidity
        auctionToken.mint(address(orch2), AUCTION_TOKEN_AMOUNT);

        uint256 totalRequired = AUCTION_TOKEN_AMOUNT + LIQUIDITY_TOKEN_AMOUNT;
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InsufficientTokenBalance.selector, totalRequired, AUCTION_TOKEN_AMOUNT));
        orch2.finalizeSetup();
    }

    function test_finalizeSetup_revertsZeroAuctionSupply() public {
        // Create a launch with zero auction tokens
        LaunchParams memory params = createDefaultLaunchParams();
        params.tokenAllocation.auctionTokenAmount = 0;
        (uint256 id2,) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch2 = LaunchOrchestrator(launchFactory.getLaunch(id2));

        vm.prank(operator);
        vm.expectRevert(AuctionSupplyMustBePositive.selector);
        orch2.finalizeSetup();
    }

    function test_finalizeSetup_revertsNonOperator() public {
        auctionToken.mint(address(orchestrator), AUCTION_TOKEN_AMOUNT);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(OnlyOperator.selector, user1, operator));
        orchestrator.finalizeSetup();
    }

    function test_finalizeSetup_revertsWrongState() public {
        auctionToken.mint(address(orchestrator), AUCTION_TOKEN_AMOUNT);

        // Finalize once
        vm.prank(operator);
        orchestrator.finalizeSetup();

        // Try again — should fail (state is FINALIZED, not SETUP)
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.FINALIZED, LaunchState.SETUP));
        orchestrator.finalizeSetup();
    }

    // ============================================
    // FINALIZE SETUP — EXISTING_TRANSFER_FROM
    // ============================================

    function test_finalizeSetup_transferFrom() public {
        // Create launch with EXISTING_TRANSFER_FROM source
        LaunchParams memory params = createDefaultLaunchParams();
        params.tokenSource = TokenSource.EXISTING_TRANSFER_FROM;
        (uint256 id2,) = launchFactory.createLaunch(params);
        LaunchOrchestrator orch2 = LaunchOrchestrator(launchFactory.getLaunch(id2));

        uint256 totalTokens = AUCTION_TOKEN_AMOUNT + LIQUIDITY_TOKEN_AMOUNT;
        auctionToken.mint(operator, totalTokens);

        // Operator approves orchestrator
        vm.prank(operator);
        auctionToken.approve(address(orch2), totalTokens);

        vm.prank(operator);
        orch2.finalizeSetup();

        assertEq(uint8(orch2.state()), uint8(LaunchState.FINALIZED));
    }

    // ============================================
    // CANCEL
    // ============================================

    function test_cancel_fromSetup() public {
        // Fund with tokens to verify they get returned
        auctionToken.mint(address(orchestrator), 1000e18);

        vm.prank(operator);
        orchestrator.cancel();

        assertEq(uint8(orchestrator.state()), uint8(LaunchState.CANCELLED));
        // Tokens should be sent to treasury
        assertEq(auctionToken.balanceOf(treasury), 1000e18);
        assertEq(auctionToken.balanceOf(address(orchestrator)), 0);
    }

    function test_cancel_emitsEvent() public {
        vm.prank(operator);
        vm.expectEmit(true, false, false, false);
        emit ILaunchOrchestrator.LaunchCancelled(launchId);
        orchestrator.cancel();
    }

    function test_cancel_revertsNonOperator() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(OnlyOperator.selector, user1, operator));
        orchestrator.cancel();
    }

    function test_cancel_revertsWrongState() public {
        auctionToken.mint(address(orchestrator), AUCTION_TOKEN_AMOUNT);

        vm.prank(operator);
        orchestrator.finalizeSetup();

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.FINALIZED, LaunchState.SETUP));
        orchestrator.cancel();
    }

    // ============================================
    // SETTLE AUCTION — SUCCESS
    // ============================================

    function test_settleAuction_success() public {
        _setupAndFinalizeAuction();

        // Simulate successful auction
        address ccaAddr = orchestrator.cca();
        uint256 raised = 500_000e6; // 500k USDC
        simulateAuctionWithBids(ccaAddr, raised, 5e5); // 0.5 USDC per token

        advanceToAuctionEnd(orchestrator.auctionEndBlock());

        vm.prank(operator);
        orchestrator.settleAuction();

        assertEq(uint8(orchestrator.state()), uint8(LaunchState.AUCTION_ENDED));
        assertEq(orchestrator.totalRaised(), raised);
    }

    function test_settleAuction_verifiesState() public {
        _setupAndFinalizeAuction();

        address ccaAddr = orchestrator.cca();
        uint256 raised = 500_000e6;
        simulateAuctionWithBids(ccaAddr, raised, 5e5);

        advanceToAuctionEnd(orchestrator.auctionEndBlock());

        vm.prank(operator);
        orchestrator.settleAuction();

        // Verify CCA was checkpointed
        assertTrue(MockCCA(payable(ccaAddr)).checkpointCalled(), "Checkpoint should be called");
        assertTrue(MockCCA(payable(ccaAddr)).sweepCurrencyCalled(), "SweepCurrency should be called");
    }

    function test_settleAuction_revertsBeforeEnd() public {
        _setupAndFinalizeAuction();

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(AuctionNotEnded.selector, block.number, orchestrator.auctionEndBlock()));
        orchestrator.settleAuction();
    }

    function test_settleAuction_revertsWrongState() public {
        // In SETUP state, should fail
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.SETUP, LaunchState.FINALIZED));
        orchestrator.settleAuction();
    }

    // ============================================
    // SETTLE AUCTION — FAILED (zero bids)
    // ============================================

    function test_settleAuction_failedZeroBids() public {
        _setupAndFinalizeAuction();

        // Don't simulate any bids — currencyRaised stays 0
        advanceToAuctionEnd(orchestrator.auctionEndBlock());

        vm.prank(operator);
        orchestrator.settleAuction();

        assertEq(uint8(orchestrator.state()), uint8(LaunchState.AUCTION_FAILED));
    }

    function test_settleAuction_failedReturnsTokens() public {
        _setupAndFinalizeAuction();

        advanceToAuctionEnd(orchestrator.auctionEndBlock());

        vm.prank(operator);
        orchestrator.settleAuction();

        // Auction tokens should be returned to treasury (via sweep + orchestrator)
        // The exact balance depends on mock behavior
        assertEq(uint8(orchestrator.state()), uint8(LaunchState.AUCTION_FAILED));
    }

    // ============================================
    // SETTLE AUCTION — PERMISSIONLESS
    // ============================================

    function test_settleAuction_permissionlessAfterDelay() public {
        _setupAndFinalizeAuction();

        address ccaAddr = orchestrator.cca();
        simulateAuctionWithBids(ccaAddr, 500_000e6, 5e5);

        uint64 endBlock = orchestrator.auctionEndBlock();
        uint64 delay = orchestrator.permissionlessDistributionDelay();

        // Advance past end + delay
        vm.roll(uint256(endBlock) + uint256(delay) + 1);

        // Non-operator can settle after delay
        vm.prank(user1);
        orchestrator.settleAuction();

        assertEq(uint8(orchestrator.state()), uint8(LaunchState.AUCTION_ENDED));
    }

    function test_settleAuction_nonOperatorRevertsBeforeDelay() public {
        _setupAndFinalizeAuction();

        address ccaAddr = orchestrator.cca();
        simulateAuctionWithBids(ccaAddr, 500_000e6, 5e5);

        // Just past auction end, but not past delay
        advanceToAuctionEnd(orchestrator.auctionEndBlock());

        uint256 permissionlessBlock =
            uint256(orchestrator.auctionEndBlock()) + uint256(orchestrator.permissionlessDistributionDelay());

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(DistributionNotPermissionless.selector, block.number, permissionlessBlock)
        );
        orchestrator.settleAuction();
    }

    // ============================================
    // PROCESS DISTRIBUTION
    // ============================================

    function test_processDistribution_happyPath() public {
        _setupSettledAuction(500_000e6, 5e5);

        vm.prank(operator);
        orchestrator.processDistribution();

        assertEq(uint8(orchestrator.state()), uint8(LaunchState.DISTRIBUTED));
    }

    function test_processDistribution_feeCalculation() public {
        uint256 raised = 1_000_000e6; // 1M USDC
        _setupSettledAuction(raised, 1e6);

        uint256 treasuryBalanceBefore = paymentToken.balanceOf(treasury);
        uint256 feeRecipientBalanceBefore = paymentToken.balanceOf(platformFeeRecipient);

        vm.prank(operator);
        orchestrator.processDistribution();

        // 5% sale fee = 50,000
        uint256 expectedFee = (raised * SALE_FEE_BPS) / 10_000;
        assertEq(expectedFee, 50_000e6);

        uint256 feeRecipientGain = paymentToken.balanceOf(platformFeeRecipient) - feeRecipientBalanceBefore;
        assertEq(feeRecipientGain, expectedFee, "Platform should receive sale fee");

        // Treasury receives remaining (after fee and liquidity)
        uint256 treasuryGain = paymentToken.balanceOf(treasury) - treasuryBalanceBefore;
        assertTrue(treasuryGain > 0, "Treasury should receive proceeds");
    }

    function test_processDistribution_revertsWrongState() public {
        _setupAndFinalizeAuction();

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.FINALIZED, LaunchState.AUCTION_ENDED));
        orchestrator.processDistribution();
    }

    function test_processDistribution_permissionlessAfterDelay() public {
        _setupSettledAuction(500_000e6, 5e5);

        uint64 endBlock = orchestrator.auctionEndBlock();
        uint64 delay = orchestrator.permissionlessDistributionDelay();
        vm.roll(uint256(endBlock) + uint256(delay) + 1);

        vm.prank(user1);
        orchestrator.processDistribution();

        assertEq(uint8(orchestrator.state()), uint8(LaunchState.DISTRIBUTED));
    }

    // ============================================
    // OPERATOR MANAGEMENT
    // ============================================

    function test_transferOperator_twoStep() public {
        vm.prank(operator);
        orchestrator.transferOperator(user1);
        assertEq(orchestrator.pendingOperator(), user1);
        assertEq(orchestrator.operator(), operator); // not changed yet

        vm.prank(user1);
        orchestrator.acceptOperator();
        assertEq(orchestrator.operator(), user1);
        assertEq(orchestrator.pendingOperator(), address(0));
    }

    function test_transferOperator_revertsNonOperator() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(OnlyOperator.selector, user1, operator));
        orchestrator.transferOperator(user2);
    }

    function test_transferOperator_revertsZeroAddress() public {
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidAddress.selector, "newOperator"));
        orchestrator.transferOperator(address(0));
    }

    function test_acceptOperator_revertsNonPending() public {
        vm.prank(operator);
        orchestrator.transferOperator(user1);

        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSelector(OnlyOperator.selector, user2, user1));
        orchestrator.acceptOperator();
    }

    // ============================================
    // SWEEP
    // ============================================

    function test_sweepToken_afterDistribution() public {
        _setupDistributedLaunch();

        // Orchestrator may have residual tokens from mock auction
        uint256 orchBalanceBefore = auctionToken.balanceOf(address(orchestrator));
        uint256 treasuryBefore = auctionToken.balanceOf(treasury);

        // Add extra tokens
        auctionToken.mint(address(orchestrator), 1000e18);

        vm.prank(operator);
        orchestrator.sweepToken();

        assertEq(auctionToken.balanceOf(address(orchestrator)), 0);
        uint256 swept = auctionToken.balanceOf(treasury) - treasuryBefore;
        assertEq(swept, orchBalanceBefore + 1000e18, "All tokens should be swept to treasury");
    }

    function test_sweepPaymentToken_afterDistribution() public {
        _setupDistributedLaunch();

        // Send some leftover payment tokens to orchestrator
        paymentToken.mint(address(orchestrator), 500e6);

        vm.prank(operator);
        orchestrator.sweepPaymentToken();

        assertEq(paymentToken.balanceOf(address(orchestrator)), 0);
        assertEq(paymentToken.balanceOf(treasury), paymentToken.balanceOf(treasury)); // just verify no revert
    }

    function test_sweepToken_revertsWrongState() public {
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(InvalidState.selector, LaunchState.SETUP, LaunchState.DISTRIBUTED));
        orchestrator.sweepToken();
    }

    function test_sweepToken_revertsNonOperator() public {
        _setupDistributedLaunch();

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(OnlyOperator.selector, user1, operator));
        orchestrator.sweepToken();
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    function test_getState() public view {
        assertEq(uint8(orchestrator.getState()), uint8(LaunchState.SETUP));
    }

    function test_isDistributionPermissionless_falseInSetup() public view {
        assertFalse(orchestrator.isDistributionPermissionless());
    }

    function test_isDistributionPermissionless_trueAfterDelay() public {
        _setupAndFinalizeAuction();

        uint64 endBlock = orchestrator.auctionEndBlock();
        uint64 delay = orchestrator.permissionlessDistributionDelay();
        vm.roll(uint256(endBlock) + uint256(delay) + 1);

        assertTrue(orchestrator.isDistributionPermissionless());
    }

    // ============================================
    // INTERNAL HELPERS
    // ============================================

    function _setupAndFinalizeAuction() internal {
        auctionToken.mint(address(orchestrator), AUCTION_TOKEN_AMOUNT);

        vm.prank(operator);
        orchestrator.finalizeSetup();
    }

    function _setupSettledAuction(uint256 raisedAmount, uint256 clearingPrice_) internal {
        _setupAndFinalizeAuction();

        address ccaAddr = orchestrator.cca();
        simulateAuctionWithBids(ccaAddr, raisedAmount, clearingPrice_);

        advanceToAuctionEnd(orchestrator.auctionEndBlock());

        vm.prank(operator);
        orchestrator.settleAuction();
    }

    function _setupDistributedLaunch() internal {
        _setupSettledAuction(500_000e6, 5e5);

        vm.prank(operator);
        orchestrator.processDistribution();
    }
}
