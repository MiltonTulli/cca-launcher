// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";

import {LaunchFactory} from "../../src/LaunchFactory.sol";
import {LaunchOrchestrator} from "../../src/LaunchOrchestrator.sol";
import {OrchestratorDeployer} from "../../src/OrchestratorDeployer.sol";
import {TokenFactory} from "../../src/TokenFactory.sol";
import {CCAAdapter} from "../../src/CCAAdapter.sol";
import {LiquidityLockup} from "../../src/LiquidityLockup.sol";
import {LiquidityLockupFactory} from "../../src/LiquidityLockupFactory.sol";
import {
    LaunchParams,
    AuctionConfig,
    TokenAllocation,
    SettlementConfig,
    LiquidityProvisionConfig,
    PlatformFeeConfig,
    TokenSource,
    LaunchState,
    TokenCreationParams
} from "../../src/types/LaunchTypes.sol";

/// @notice Integration tests against Sepolia fork
/// @dev Run with: forge test --match-contract SepoliaIntegrationTest --fork-url https://rpc.sepolia.org -vvv
/// @dev These tests deploy fresh contracts on the fork and run the full lifecycle.
///      They do NOT depend on pre-deployed contracts for the new system.
///      CCA factory address must be available on Sepolia.
contract SepoliaIntegrationTest is Test {
    // ============================================
    // SEPOLIA KNOWN ADDRESSES
    // ============================================

    // CCA factory from the V3 deployment (PermitterFactory)
    address constant CCA_FACTORY = 0x7a102F1D5646ddB6Cc2fE7B74559f706a42491Ea;

    // Test USDC on Sepolia (V3)
    address constant TEST_USDC = 0x71cD6f71B8C6d0F12514B83b381B9b1618accD3b;

    // ============================================
    // DEPLOYED CONTRACTS (fresh on fork)
    // ============================================

    LaunchFactory public launchFactory;
    OrchestratorDeployer public deployer;
    TokenFactory public tokenFactory;
    CCAAdapter public ccaAdapter;

    // ============================================
    // TEST ACCOUNTS
    // ============================================

    address public admin;
    uint256 public adminKey;
    address public operator;
    uint256 public operatorKey;
    address public treasury;
    address public platformFeeRecipient;

    // ============================================
    // CONSTANTS
    // ============================================

    uint16 constant SALE_FEE_BPS = 500;
    uint16 constant LP_FEE_SHARE_BPS = 1500;
    uint256 constant TOKEN_CREATION_FEE = 0.001 ether;

    function setUp() public {
        // Generate test accounts with private keys
        (admin, adminKey) = makeAddrAndKey("admin");
        (operator, operatorKey) = makeAddrAndKey("operator");
        treasury = makeAddr("treasury");
        platformFeeRecipient = makeAddr("platformFeeRecipient");

        // Fund accounts
        vm.deal(admin, 10 ether);
        vm.deal(operator, 10 ether);

        // Deploy fresh contracts
        tokenFactory = new TokenFactory(TOKEN_CREATION_FEE, platformFeeRecipient);
        deployer = new OrchestratorDeployer();

        // CCA adapter wrapping the real factory
        ccaAdapter = new CCAAdapter(CCA_FACTORY);

        // Mock postAuctionHandler (V4 pool creation needs real PoolManager — skip for this test)
        address mockPostAuctionHandler = makeAddr("postAuctionHandler");

        PlatformFeeConfig memory feeConfig = PlatformFeeConfig({
            feeRecipient: platformFeeRecipient,
            saleFeeBps: SALE_FEE_BPS,
            lpFeeShareBps: LP_FEE_SHARE_BPS,
            tokenCreationFee: TOKEN_CREATION_FEE
        });

        launchFactory = new LaunchFactory(
            admin, feeConfig, address(deployer), address(ccaAdapter), mockPostAuctionHandler, address(tokenFactory)
        );

        vm.label(address(launchFactory), "LaunchFactory");
        vm.label(address(ccaAdapter), "CCAAdapter");
        vm.label(address(tokenFactory), "TokenFactory");
        vm.label(TEST_USDC, "TestUSDC");
        vm.label(CCA_FACTORY, "CCAFactory");
    }

    // ============================================
    // SMOKE TEST: Verify fork is working
    // ============================================

    function test_forkSmokeTest() public view {
        // Verify we're on a fork with the expected state
        assertTrue(block.number > 0, "Fork should have blocks");

        // CCA factory should have code
        uint256 codeSize;
        address factory = CCA_FACTORY;
        assembly {
            codeSize := extcodesize(factory)
        }
        assertTrue(codeSize > 0, "CCA factory should have code on Sepolia");
    }

    // ============================================
    // TOKEN FACTORY: CREATE_NEW on fork
    // ============================================

    function test_fork_createToken() public {
        vm.prank(operator);
        address token = tokenFactory.createToken{value: TOKEN_CREATION_FEE}(
            TokenCreationParams({
                name: "Fork Test Token", symbol: "FTT", decimals: 18, initialSupply: 0, initialHolder: address(0)
            }),
            operator
        );

        assertTrue(token != address(0), "Token should be deployed");
    }

    // ============================================
    // LAUNCH FACTORY: Create launch on fork
    // ============================================

    function test_fork_createLaunch() public {
        // First create a token
        vm.prank(operator);
        address token = tokenFactory.createToken{value: TOKEN_CREATION_FEE}(
            TokenCreationParams({
                name: "Launch Token", symbol: "LT", decimals: 18, initialSupply: 0, initialHolder: address(0)
            }),
            operator
        );

        LaunchParams memory params = LaunchParams({
            tokenSource: TokenSource.EXISTING_BALANCE,
            token: token,
            paymentToken: TEST_USDC,
            operator: operator,
            auctionConfig: AuctionConfig({
                startBlock: uint64(block.number + 10),
                endBlock: uint64(block.number + 100),
                claimBlock: uint64(block.number + 100),
                reservePrice: 1e6,
                auctionStepsData: "",
                validationHook: address(0)
            }),
            tokenAllocation: TokenAllocation({auctionTokenAmount: 1_000_000e18, liquidityTokenAmount: 0}),
            liquidityConfig: LiquidityProvisionConfig({
                enabled: false,
                proceedsToLiquidityBps: 0,
                positionBeneficiary: address(0),
                poolFee: 0,
                tickLower: 0,
                tickUpper: 0,
                lockupEnabled: false,
                lockupDuration: 0
            }),
            settlementConfig: SettlementConfig({treasury: treasury, permissionlessDistributionDelay: 50}),
            metadataHash: bytes32(0)
        });

        (, address orchAddr) = launchFactory.createLaunch(params);

        assertTrue(orchAddr != address(0), "Orchestrator should be deployed");

        LaunchOrchestrator orch = LaunchOrchestrator(orchAddr);
        assertEq(uint8(orch.state()), uint8(LaunchState.SETUP));
        assertEq(orch.token(), token);
    }

    // ============================================
    // LOCKUP: Clone deployment on fork
    // ============================================

    function test_fork_lockupClone() public {
        LiquidityLockup impl = new LiquidityLockup();
        LiquidityLockupFactory lockupFactory = new LiquidityLockupFactory(address(impl));

        uint64 unlockTs = uint64(block.timestamp) + 30 days;
        address lockup = lockupFactory.createLockup(makeAddr("vault"), operator, unlockTs);

        assertTrue(lockup != address(0), "Lockup should be deployed");

        // Verify the clone has code and state
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(lockup)
        }
        assertTrue(codeSize > 0, "Lockup clone should have code");
    }

    // ============================================
    // CCA ADAPTER: Verify adapter deployment
    // ============================================

    function test_fork_ccaAdapterDeployed() public view {
        assertEq(address(ccaAdapter.ccaFactory()), CCA_FACTORY);
    }
}
