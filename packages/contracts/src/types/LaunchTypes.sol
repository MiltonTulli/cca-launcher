// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// ============================================
// ENUMS
// ============================================

/// @notice How the launch token is sourced
enum TokenSource {
    EXISTING_BALANCE, // tokens already deposited in orchestrator
    EXISTING_TRANSFER_FROM, // pull via approve + transferFrom from operator
    CREATE_NEW // create via TokenFactory (deferred mint)
}

/// @notice Launch lifecycle states (persisted onchain)
/// @dev AUCTION_ACTIVE is derived in UI from FINALIZED + block range, not stored
enum LaunchState {
    SETUP,
    FINALIZED,
    AUCTION_ENDED,
    DISTRIBUTED,
    CANCELLED,
    AUCTION_FAILED
}

/// @notice Liquidity position lifecycle (separate from LaunchState)
enum LiquidityState {
    NONE,
    LOCKED,
    UNLOCKED,
    WITHDRAWN
}

// ============================================
// LAUNCH PARAMS (top-level + substructs)
// ============================================

/// @notice Full launch configuration passed to LaunchFactory.createLaunch()
struct LaunchParams {
    TokenSource tokenSource;
    address token; // address(0) for CREATE_NEW (set later via createToken())
    address paymentToken;
    address operator;
    AuctionConfig auctionConfig;
    TokenAllocation tokenAllocation;
    LiquidityProvisionConfig liquidityConfig;
    SettlementConfig settlementConfig;
    bytes32 metadataHash;
}

/// @notice CCA auction parameters
struct AuctionConfig {
    uint64 startBlock;
    uint64 endBlock;
    uint64 claimBlock;
    uint256 reservePrice;
    bytes auctionStepsData;
    address validationHook;
}

/// @notice How tokens are split between auction and liquidity
struct TokenAllocation {
    uint256 auctionTokenAmount;
    uint256 liquidityTokenAmount;
}

/// @notice Post-auction settlement parameters
/// @dev saleFeeBps is NOT here — it's a global factory config snapshotted into orchestrator
struct SettlementConfig {
    address treasury;
    uint64 permissionlessDistributionDelay; // in blocks
}

/// @notice Liquidity bootstrap configuration
/// @dev tokenLiquidityAmount is sourced from TokenAllocation.liquidityTokenAmount (single source of truth)
struct LiquidityProvisionConfig {
    bool enabled;
    uint16 proceedsToLiquidityBps;
    address positionBeneficiary;
    uint24 poolFee;
    int24 tickSpacing;
    int24 tickLower;
    int24 tickUpper;
    bool lockupEnabled;
    uint64 lockupDuration; // in seconds (timestamp-based)
}

// ============================================
// PLATFORM & VAULT CONFIG
// ============================================

/// @notice Global platform fee configuration (set on factory, snapshotted per launch)
struct PlatformFeeConfig {
    address feeRecipient;
    uint16 saleFeeBps; // fee on auction proceeds (e.g., 500 = 5%)
    uint16 lpFeeShareBps; // platform share of LP swap fees (e.g., 1500 = 15%)
    uint256 tokenCreationFee; // flat fee in ETH for CREATE_NEW
}

/// @notice Per-vault fee split configuration
struct VaultConfig {
    address platformBeneficiary;
    address creatorBeneficiary;
    uint16 platformFeeBps; // e.g., 1500 = 15%
}

/// @notice Tracks liquidity position state within a launch
struct LiquidityInfo {
    LiquidityState state;
    address vault;
    address lockup;
    uint256 positionTokenId;
    uint64 unlockTimestamp;
}

/// @notice Parameters for creating a new token via TokenFactory
struct TokenCreationParams {
    string name;
    string symbol;
    uint8 decimals;
    uint256 initialSupply;
    address initialHolder;
}
