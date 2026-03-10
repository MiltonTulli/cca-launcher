// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {
    LaunchParams,
    AuctionConfig,
    TokenAllocation,
    SettlementConfig,
    LiquidityProvisionConfig,
    PlatformFeeConfig,
    VaultConfig,
    TokenSource
} from "../../src/types/LaunchTypes.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {MockCCAFactory} from "../mocks/MockCCAFactory.sol";
import {MockCCA} from "../mocks/MockCCA.sol";
import {MockPoolManager} from "../mocks/MockPoolManager.sol";
import {MockPositionManager} from "../mocks/MockPositionManager.sol";

/// @notice Shared test harness for all contract tests
abstract contract TestBase is Test {
    // ============================================
    // ADDRESSES
    // ============================================
    address public platformAdmin = makeAddr("platformAdmin");
    address public platformFeeRecipient = makeAddr("platformFeeRecipient");
    address public operator = makeAddr("operator");
    address public treasury = makeAddr("treasury");
    address public positionBeneficiary = makeAddr("positionBeneficiary");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    // ============================================
    // MOCKS
    // ============================================
    MockERC20 public auctionToken;
    MockERC20 public paymentToken;
    MockCCAFactory public ccaFactory;
    MockPoolManager public poolManager;
    MockPositionManager public positionManager;

    // ============================================
    // CONSTANTS
    // ============================================
    uint16 public constant SALE_FEE_BPS = 500; // 5%
    uint16 public constant LP_FEE_SHARE_BPS = 1500; // 15%
    uint256 public constant TOKEN_CREATION_FEE = 0.01 ether;

    uint256 public constant AUCTION_TOKEN_AMOUNT = 1_000_000e18;
    uint256 public constant LIQUIDITY_TOKEN_AMOUNT = 500_000e18;
    uint256 public constant RESERVE_PRICE = 1e6; // 1 USDC per token (6 decimals)

    function setUp() public virtual {
        // Deploy mock tokens
        auctionToken = new MockERC20("Auction Token", "AUC", 18);
        paymentToken = new MockERC20("Test USDC", "USDC", 6);

        // Deploy mock infrastructure
        ccaFactory = new MockCCAFactory();
        poolManager = new MockPoolManager();
        positionManager = new MockPositionManager();

        // Label addresses for trace readability
        vm.label(platformAdmin, "PlatformAdmin");
        vm.label(platformFeeRecipient, "PlatformFeeRecipient");
        vm.label(operator, "Operator");
        vm.label(treasury, "Treasury");
        vm.label(positionBeneficiary, "PositionBeneficiary");
        vm.label(address(auctionToken), "AuctionToken");
        vm.label(address(paymentToken), "PaymentToken");
        vm.label(address(ccaFactory), "CCAFactory");
        vm.label(address(poolManager), "PoolManager");
        vm.label(address(positionManager), "PositionManager");
    }

    // ============================================
    // HELPERS
    // ============================================

    function createDefaultPlatformFeeConfig() internal view returns (PlatformFeeConfig memory) {
        return PlatformFeeConfig({
            feeRecipient: platformFeeRecipient,
            saleFeeBps: SALE_FEE_BPS,
            lpFeeShareBps: LP_FEE_SHARE_BPS,
            tokenCreationFee: TOKEN_CREATION_FEE
        });
    }

    function createDefaultLaunchParams() internal view returns (LaunchParams memory) {
        return LaunchParams({
            tokenSource: TokenSource.EXISTING_BALANCE,
            token: address(auctionToken),
            paymentToken: address(paymentToken),
            operator: operator,
            auctionConfig: AuctionConfig({
                startBlock: uint64(block.number + 10),
                endBlock: uint64(block.number + 110),
                claimBlock: uint64(block.number + 110),
                reservePrice: RESERVE_PRICE,
                auctionStepsData: "",
                validationHook: address(0)
            }),
            tokenAllocation: TokenAllocation({
                auctionTokenAmount: AUCTION_TOKEN_AMOUNT, liquidityTokenAmount: LIQUIDITY_TOKEN_AMOUNT
            }),
            liquidityConfig: LiquidityProvisionConfig({
                enabled: true,
                proceedsToLiquidityBps: 5000, // 50% of proceeds to LP
                positionBeneficiary: positionBeneficiary,
                poolFee: 3000,
                tickLower: -887220,
                tickUpper: 887220,
                lockupEnabled: false,
                lockupDuration: 0
            }),
            settlementConfig: SettlementConfig({treasury: treasury, permissionlessDistributionDelay: 100}),
            metadataHash: bytes32(0)
        });
    }

    function createDefaultVaultConfig() internal view returns (VaultConfig memory) {
        return VaultConfig({
            platformBeneficiary: platformFeeRecipient, creatorBeneficiary: treasury, platformFeeBps: LP_FEE_SHARE_BPS
        });
    }

    /// @notice Advance blocks to after the auction end
    function advanceToAuctionEnd(uint64 endBlock) internal {
        vm.roll(endBlock + 1);
    }

    /// @notice Simulate an auction with bids by funding the MockCCA with payment tokens
    function simulateAuctionWithBids(address cca, uint256 raisedAmount, uint256 clearingPrice_) internal {
        MockCCA(payable(cca)).setCurrencyRaised(raisedAmount);
        MockCCA(payable(cca)).setClearingPrice(clearingPrice_);
        // Fund the CCA with payment tokens to simulate actual raises
        paymentToken.mint(cca, raisedAmount);
    }
}
