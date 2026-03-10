// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ILaunchOrchestrator} from "./interfaces/ILaunchOrchestrator.sol";
import {IAuctionInitializer} from "./interfaces/IAuctionInitializer.sol";
import {IPostAuctionHandler} from "./interfaces/IPostAuctionHandler.sol";
import {ITokenFactory} from "./interfaces/ITokenFactory.sol";
import {ICCA} from "./interfaces/ICCA.sol";
import {
    LaunchParams,
    AuctionConfig,
    TokenAllocation,
    SettlementConfig,
    LiquidityProvisionConfig,
    LiquidityInfo,
    VaultConfig,
    TokenCreationParams,
    TokenSource,
    LaunchState,
    LiquidityState
} from "./types/LaunchTypes.sol";
import {
    InvalidState,
    OnlyOperator,
    InsufficientTokenBalance,
    InsufficientAllowance,
    AuctionSupplyMustBePositive,
    AuctionNotEnded,
    DistributionNotPermissionless,
    AuctionHasNoBids,
    AuctionNotFailed,
    InvalidAddress,
    ZeroAddress,
    TokenNotCreated,
    TokenAlreadyCreated,
    InvalidTokenSource
} from "./errors/LaunchErrors.sol";

/// @title LaunchOrchestrator
/// @notice Per-launch lifecycle coordinator: setup, settlement, distribution
/// @dev Focused on coordination. Uniswap V4 details are delegated to PostAuctionHandler.
contract LaunchOrchestrator is ILaunchOrchestrator, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============================================
    // IMMUTABLE STATE
    // ============================================

    uint256 public immutable launchId;
    address public immutable factory;
    address public immutable paymentToken;
    TokenSource public immutable tokenSource;

    // Auction config
    uint64 public immutable auctionStartBlock;
    uint64 public immutable auctionEndBlockConfig;
    uint64 public immutable claimBlock;
    uint256 public immutable reservePrice;
    address public immutable validationHook;

    // Token allocation
    uint256 public immutable auctionTokenAmount;
    uint256 public immutable liquidityTokenAmount;

    // Settlement
    address public immutable treasuryAddress;
    uint64 public immutable permissionlessDistributionDelay;
    uint16 public immutable saleFeeBpsSnapshot;

    // Liquidity config
    bool public immutable liquidityEnabled;
    uint16 public immutable proceedsToLiquidityBps;
    address public immutable positionBeneficiary;
    uint24 public immutable poolFee;
    int24 public immutable tickLower;
    int24 public immutable tickUpper;
    bool public immutable lockupEnabled;
    uint64 public immutable lockupDuration;

    // Infrastructure
    IAuctionInitializer public immutable auctionInitializer;
    IPostAuctionHandler public immutable postAuctionHandler;
    ITokenFactory public immutable tokenFactoryContract;
    address public immutable platformFeeRecipient;
    uint16 public immutable lpFeeShareBps;

    bytes public auctionStepsData;

    // ============================================
    // MUTABLE STATE
    // ============================================

    LaunchState public state;
    address public token; // mutable: address(0) for CREATE_NEW until createToken()
    address public operator;
    address public pendingOperator;
    address public cca;
    uint64 public auctionEndBlock;
    uint256 public distributionTimestamp;
    uint256 public totalRaised;
    uint256 public tokensSold;
    LiquidityInfo public liquidityInfo;

    bytes32 public metadataHash;

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyOperator() {
        if (msg.sender != operator) revert OnlyOperator(msg.sender, operator);
        _;
    }

    modifier inState(LaunchState required) {
        if (state != required) revert InvalidState(state, required);
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(
        uint256 launchId_,
        address factory_,
        LaunchParams memory params,
        uint16 saleFeeBpsSnapshot_,
        address auctionInitializer_,
        address postAuctionHandler_,
        address tokenFactory_,
        address platformFeeRecipient_,
        uint16 lpFeeShareBps_
    ) {
        launchId = launchId_;
        factory = factory_;

        // Token (mutable for CREATE_NEW)
        tokenSource = params.tokenSource;
        if (params.tokenSource != TokenSource.CREATE_NEW) {
            token = params.token;
        }
        // else: token stays address(0), set by createToken()

        paymentToken = params.paymentToken;
        operator = params.operator;

        // Auction config
        auctionStartBlock = params.auctionConfig.startBlock;
        auctionEndBlockConfig = params.auctionConfig.endBlock;
        claimBlock = params.auctionConfig.claimBlock;
        reservePrice = params.auctionConfig.reservePrice;
        validationHook = params.auctionConfig.validationHook;
        auctionStepsData = params.auctionConfig.auctionStepsData;

        // Token allocation
        auctionTokenAmount = params.tokenAllocation.auctionTokenAmount;
        liquidityTokenAmount = params.tokenAllocation.liquidityTokenAmount;

        // Settlement
        treasuryAddress = params.settlementConfig.treasury;
        permissionlessDistributionDelay = params.settlementConfig.permissionlessDistributionDelay;
        saleFeeBpsSnapshot = saleFeeBpsSnapshot_;

        // Liquidity
        liquidityEnabled = params.liquidityConfig.enabled;
        proceedsToLiquidityBps = params.liquidityConfig.proceedsToLiquidityBps;
        positionBeneficiary = params.liquidityConfig.positionBeneficiary;
        poolFee = params.liquidityConfig.poolFee;
        tickLower = params.liquidityConfig.tickLower;
        tickUpper = params.liquidityConfig.tickUpper;
        lockupEnabled = params.liquidityConfig.lockupEnabled;
        lockupDuration = params.liquidityConfig.lockupDuration;

        // Infrastructure
        auctionInitializer = IAuctionInitializer(auctionInitializer_);
        postAuctionHandler = IPostAuctionHandler(postAuctionHandler_);
        tokenFactoryContract = ITokenFactory(tokenFactory_);
        platformFeeRecipient = platformFeeRecipient_;
        lpFeeShareBps = lpFeeShareBps_;

        metadataHash = params.metadataHash;
        state = LaunchState.SETUP;
    }

    // ============================================
    // TOKEN CREATION (CREATE_NEW only)
    // ============================================

    /// @inheritdoc ILaunchOrchestrator
    function createToken(TokenCreationParams calldata params) external payable onlyOperator inState(LaunchState.SETUP) {
        if (tokenSource != TokenSource.CREATE_NEW) revert InvalidTokenSource();
        if (token != address(0)) revert TokenAlreadyCreated();

        token = tokenFactoryContract.createToken{value: msg.value}(params, address(this));

        emit TokenCreated(launchId, token);
    }

    // ============================================
    // LIFECYCLE: SETUP → FINALIZED
    // ============================================

    /// @inheritdoc ILaunchOrchestrator
    function finalizeSetup() external onlyOperator inState(LaunchState.SETUP) nonReentrant {
        uint256 totalTokenAmount = auctionTokenAmount + liquidityTokenAmount;
        if (auctionTokenAmount == 0) revert AuctionSupplyMustBePositive();

        // Resolve token source
        _resolveTokenSource(totalTokenAmount);

        // Deploy CCA via adapter
        bytes memory configData = abi.encode(
            paymentToken,
            address(this), // tokensRecipient (unsold tokens return here)
            address(this), // fundsRecipient (raised funds come here)
            auctionStartBlock,
            auctionEndBlockConfig,
            claimBlock,
            reservePrice,
            validationHook,
            auctionStepsData
        );

        cca = auctionInitializer.createAuction(token, auctionTokenAmount, configData, bytes32(uint256(launchId)));

        // Transfer auction tokens to CCA
        IERC20(token).safeTransfer(cca, auctionTokenAmount);

        auctionEndBlock = auctionEndBlockConfig;
        state = LaunchState.FINALIZED;

        emit SetupFinalized(launchId, cca, auctionTokenAmount, auctionEndBlock);
    }

    /// @inheritdoc ILaunchOrchestrator
    function cancel() external onlyOperator inState(LaunchState.SETUP) nonReentrant {
        state = LaunchState.CANCELLED;

        // Return any tokens held by the orchestrator to treasury
        if (token != address(0)) {
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > 0) {
                IERC20(token).safeTransfer(treasuryAddress, balance);
            }
        }

        emit LaunchCancelled(launchId);
    }

    // ============================================
    // LIFECYCLE: FINALIZED → AUCTION_ENDED / AUCTION_FAILED
    // ============================================

    /// @inheritdoc ILaunchOrchestrator
    function settleAuction() external inState(LaunchState.FINALIZED) nonReentrant {
        if (block.number < auctionEndBlock) revert AuctionNotEnded(block.number, auctionEndBlock);

        _checkPermissionlessDelay();

        ICCA auction = ICCA(cca);
        auction.checkpoint();

        uint256 raised = auction.currencyRaised();

        if (raised == 0) {
            state = LaunchState.AUCTION_FAILED;

            // Return tokens to treasury via CCA sweep
            try auction.sweepUnsoldTokens() {} catch {}

            // Return any remaining tokens held by orchestrator
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > 0) {
                IERC20(token).safeTransfer(treasuryAddress, balance);
            }

            emit AuctionFailed(launchId, "Zero bids");
            return;
        }

        // Sweep funds and unsold tokens from CCA to orchestrator
        auction.sweepCurrency();
        try auction.sweepUnsoldTokens() {} catch {}

        totalRaised = raised;

        // Calculate tokens sold
        uint256 remainingTokens = IERC20(token).balanceOf(address(this));
        tokensSold = (auctionTokenAmount + liquidityTokenAmount) - remainingTokens;

        state = LaunchState.AUCTION_ENDED;

        emit AuctionSettled(launchId, totalRaised, tokensSold);
    }

    // ============================================
    // LIFECYCLE: AUCTION_ENDED → DISTRIBUTED
    // ============================================

    /// @inheritdoc ILaunchOrchestrator
    function processDistribution() external inState(LaunchState.AUCTION_ENDED) nonReentrant {
        _checkPermissionlessDelay();

        uint256 raised = totalRaised;

        // Calculate sale fee
        uint256 saleFee = (raised * saleFeeBpsSnapshot) / 10_000;
        uint256 proceedsAfterFee = raised - saleFee;

        // Send sale fee to platform
        if (saleFee > 0) {
            IERC20(paymentToken).safeTransfer(platformFeeRecipient, saleFee);
        }

        uint256 liquidityPaymentAmount = 0;

        // Create LP if enabled
        if (liquidityEnabled && liquidityTokenAmount > 0) {
            liquidityPaymentAmount = (proceedsAfterFee * proceedsToLiquidityBps) / 10_000;

            if (liquidityPaymentAmount > 0) {
                uint256 tokenLiqAmount = liquidityTokenAmount;

                // Approve tokens for PostAuctionHandler
                IERC20(token).safeIncreaseAllowance(address(postAuctionHandler), tokenLiqAmount);
                IERC20(paymentToken).safeIncreaseAllowance(address(postAuctionHandler), liquidityPaymentAmount);

                ICCA auction = ICCA(cca);
                uint256 clearingPrice_ = auction.clearingPrice();

                VaultConfig memory vaultCfg = VaultConfig({
                    platformBeneficiary: platformFeeRecipient,
                    creatorBeneficiary: treasuryAddress,
                    platformFeeBps: lpFeeShareBps
                });

                (address vault, uint256 posTokenId) = postAuctionHandler.createLiquidityPosition(
                    token,
                    paymentToken,
                    tokenLiqAmount,
                    liquidityPaymentAmount,
                    poolFee,
                    tickUpper - tickLower > 0 ? int24(60) : int24(60), // tick spacing
                    clearingPrice_,
                    vaultCfg,
                    lockupEnabled,
                    lockupDuration,
                    positionBeneficiary
                );

                liquidityInfo = LiquidityInfo({
                    state: lockupEnabled ? LiquidityState.LOCKED : LiquidityState.UNLOCKED,
                    vault: vault,
                    lockup: address(0), // set by PostAuctionHandler if lockup
                    positionTokenId: posTokenId,
                    unlockTimestamp: lockupEnabled ? uint64(block.timestamp + lockupDuration) : 0
                });
            }
        }

        // Send remaining proceeds to treasury
        uint256 treasuryAmount = proceedsAfterFee - liquidityPaymentAmount;
        if (treasuryAmount > 0) {
            IERC20(paymentToken).safeTransfer(treasuryAddress, treasuryAmount);
        }

        distributionTimestamp = block.timestamp;
        state = LaunchState.DISTRIBUTED;

        emit DistributionComplete(launchId, saleFee, liquidityPaymentAmount, treasuryAmount);
    }

    // ============================================
    // OPERATOR MANAGEMENT
    // ============================================

    /// @inheritdoc ILaunchOrchestrator
    function transferOperator(address newOperator) external onlyOperator {
        if (newOperator == address(0)) revert InvalidAddress("newOperator");
        pendingOperator = newOperator;
        emit OperatorTransferStarted(operator, newOperator);
    }

    /// @inheritdoc ILaunchOrchestrator
    function acceptOperator() external {
        if (msg.sender != pendingOperator) revert OnlyOperator(msg.sender, pendingOperator);
        address previous = operator;
        operator = msg.sender;
        pendingOperator = address(0);
        emit OperatorTransferred(previous, msg.sender);
    }

    // ============================================
    // SWEEP (post-distribution cleanup)
    // ============================================

    /// @inheritdoc ILaunchOrchestrator
    function sweepToken() external onlyOperator inState(LaunchState.DISTRIBUTED) {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(treasuryAddress, balance);
            emit TokenSwept(token, balance);
        }
    }

    /// @inheritdoc ILaunchOrchestrator
    function sweepPaymentToken() external onlyOperator inState(LaunchState.DISTRIBUTED) {
        uint256 balance = IERC20(paymentToken).balanceOf(address(this));
        if (balance > 0) {
            IERC20(paymentToken).safeTransfer(treasuryAddress, balance);
            emit PaymentTokenSwept(paymentToken, balance);
        }
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /// @inheritdoc ILaunchOrchestrator
    function getState() external view override returns (LaunchState) {
        return state;
    }

    /// @inheritdoc ILaunchOrchestrator
    function isDistributionPermissionless() external view override returns (bool) {
        if (state == LaunchState.SETUP || state == LaunchState.CANCELLED || state == LaunchState.AUCTION_FAILED) {
            return false;
        }
        return block.number >= auctionEndBlock + permissionlessDistributionDelay;
    }

    // ============================================
    // INTERNAL
    // ============================================

    function _resolveTokenSource(uint256 totalTokenAmount) internal {
        if (tokenSource == TokenSource.EXISTING_BALANCE) {
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance < totalTokenAmount) {
                revert InsufficientTokenBalance(totalTokenAmount, balance);
            }
        } else if (tokenSource == TokenSource.EXISTING_TRANSFER_FROM) {
            IERC20(token).safeTransferFrom(operator, address(this), totalTokenAmount);
        } else if (tokenSource == TokenSource.CREATE_NEW) {
            if (token == address(0)) revert TokenNotCreated();
            // Mint required supply to orchestrator
            // LaunchToken exposes mint(address, uint256) gated by MINTER_ROLE
            (bool ok,) = token.call(abi.encodeWithSignature("mint(address,uint256)", address(this), totalTokenAmount));
            require(ok, "Mint failed");
        }
    }

    function _checkPermissionlessDelay() internal view {
        if (msg.sender != operator) {
            uint256 permissionlessBlock = uint256(auctionEndBlock) + uint256(permissionlessDistributionDelay);
            if (block.number < permissionlessBlock) {
                revert DistributionNotPermissionless(block.number, permissionlessBlock);
            }
        }
    }
}
