// ============================================
// TallyLaunchFactory ABI
// ============================================
export const TALLY_LAUNCH_FACTORY_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_platformAdmin", type: "address", internalType: "address" },
      { name: "_platformFeeBeneficiary", type: "address", internalType: "address" },
      { name: "_platformFeeOnLPFees", type: "uint256", internalType: "uint256" },
      { name: "_lockupImplementation", type: "address", internalType: "address" },
      { name: "_poolManager", type: "address", internalType: "contract IPoolManager" },
      { name: "_positionManager", type: "address", internalType: "contract IPositionManager" },
      { name: "_ccaFactory", type: "address", internalType: "address" },
      {
        name: "_orchestratorDeployer",
        type: "address",
        internalType: "contract IOrchestratorDeployer",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createLaunch",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "paymentToken", type: "address", internalType: "address" },
      { name: "operator", type: "address", internalType: "address" },
      {
        name: "params",
        type: "tuple",
        internalType: "struct LaunchParams",
        components: [
          { name: "tokenSource", type: "uint8", internalType: "enum TokenSource" },
          { name: "tokenAmount", type: "uint256", internalType: "uint256" },
          { name: "auctionDuration", type: "uint256", internalType: "uint256" },
          { name: "pricingSteps", type: "uint256", internalType: "uint256" },
          { name: "reservePrice", type: "uint256", internalType: "uint256" },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          { name: "liquidityAllocation", type: "uint256", internalType: "uint256" },
          { name: "treasuryAllocation", type: "uint256", internalType: "uint256" },
          { name: "treasury", type: "address", internalType: "address" },
          { name: "poolFeeTier", type: "uint24", internalType: "uint24" },
          { name: "tickSpacing", type: "int24", internalType: "int24" },
          { name: "lockupDuration", type: "uint256", internalType: "uint256" },
          { name: "distributionDelay", type: "uint256", internalType: "uint256" },
          { name: "positionBeneficiary", type: "address", internalType: "address" },
          { name: "validationHook", type: "address", internalType: "address" },
        ],
      },
    ],
    outputs: [
      { name: "launchId", type: "uint256", internalType: "uint256" },
      { name: "launcherAddress", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getLaunch",
    inputs: [{ name: "launchId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLaunchCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "launchCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "launches",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformAdmin",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFeeBeneficiary",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFeeOnLPFees",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolManager",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IPoolManager" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "positionManagerContract",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IPositionManager" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "LaunchCreated",
    inputs: [
      { name: "launchId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "launcher", type: "address", indexed: true, internalType: "address" },
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "paymentToken", type: "address", indexed: false, internalType: "address" },
      { name: "operator", type: "address", indexed: false, internalType: "address" },
      { name: "tokenAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "auctionDuration", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "lockupDuration", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "platformFeeOnLPFees", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "function",
    name: "blockTimeSeconds",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLaunchesByOperator",
    inputs: [{ name: "_operator", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "error",
    name: "BlockTimeExceedsMinAuction",
    inputs: [
      { name: "blockTime", type: "uint256", internalType: "uint256" },
      { name: "minAuctionDuration", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "BlockTimeMustBePositive",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidAddress",
    inputs: [{ name: "param", type: "string", internalType: "string" }],
  },
  {
    type: "error",
    name: "InvalidPlatformFeeOnLPFees",
    inputs: [
      { name: "provided", type: "uint256", internalType: "uint256" },
      { name: "max", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "NotPendingPlatformAdmin",
    inputs: [],
  },
  {
    type: "error",
    name: "NotPlatformAdmin",
    inputs: [],
  },
  {
    type: "error",
    name: "NotRegisteredLaunch",
    inputs: [{ name: "caller", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: [],
  },
] as const;

// ============================================
// TallyLaunchOrchestrator ABI
// ============================================
export const TALLY_LAUNCH_ORCHESTRATOR_ABI = [
  // --- View: individual fields ---
  {
    type: "function",
    name: "operator",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "state",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "enum LaunchState" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "token",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "paymentToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenAmount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "auctionDuration",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "launchId",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenSource",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "enum TokenSource" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "auctionEndTime",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "distributionDelay",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "distributionTimestamp",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  // --- View: struct-returning ---
  {
    type: "function",
    name: "getLaunchInfo",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct LaunchInfo",
        components: [
          { name: "launchId", type: "uint256", internalType: "uint256" },
          { name: "launcher", type: "address", internalType: "address" },
          { name: "token", type: "address", internalType: "address" },
          { name: "paymentToken", type: "address", internalType: "address" },
          { name: "operator", type: "address", internalType: "address" },
          { name: "treasury", type: "address", internalType: "address" },
          { name: "state", type: "uint8", internalType: "enum LaunchState" },
          { name: "auctionDuration", type: "uint256", internalType: "uint256" },
          { name: "pricingSteps", type: "uint256", internalType: "uint256" },
          { name: "reservePrice", type: "uint256", internalType: "uint256" },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          { name: "liquidityAllocation", type: "uint256", internalType: "uint256" },
          { name: "treasuryAllocation", type: "uint256", internalType: "uint256" },
          { name: "poolFeeTier", type: "uint24", internalType: "uint24" },
          { name: "tickSpacing", type: "int24", internalType: "int24" },
          { name: "lockupDuration", type: "uint256", internalType: "uint256" },
          { name: "unlockTime", type: "uint256", internalType: "uint256" },
          { name: "positionBeneficiary", type: "address", internalType: "address" },
          { name: "platformFeeOnLPFees", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDistributionState",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct DistributionInfo",
        components: [
          { name: "totalRaised", type: "uint256", internalType: "uint256" },
          { name: "tokensSold", type: "uint256", internalType: "uint256" },
          { name: "treasuryPaid", type: "uint256", internalType: "uint256" },
          { name: "liquidityCreated", type: "uint256", internalType: "uint256" },
          { name: "liquidityComplete", type: "bool", internalType: "bool" },
          { name: "treasuryComplete", type: "bool", internalType: "bool" },
          { name: "cca", type: "address", internalType: "address" },
          { name: "lockupContract", type: "address", internalType: "address" },
          { name: "positionTokenId", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAuctionInfo",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct AuctionInfo",
        components: [
          { name: "cca", type: "address", internalType: "address" },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          { name: "endTime", type: "uint256", internalType: "uint256" },
          { name: "currentPrice", type: "uint256", internalType: "uint256" },
          { name: "reservePrice", type: "uint256", internalType: "uint256" },
          { name: "tokensSold", type: "uint256", internalType: "uint256" },
          { name: "totalRaised", type: "uint256", internalType: "uint256" },
          { name: "isActive", type: "bool", internalType: "bool" },
          { name: "hasEnded", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isDistributionPermissionless",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isUnlocked",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pendingOperator",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pendingTreasuryPayment",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  // --- State-changing functions ---
  {
    type: "function",
    name: "finalizeSetup",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "startAuction",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distributeLiquidity",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distributeTreasury",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distributeAll",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizeFailedAuction",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sweepToken",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sweepPaymentToken",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawPosition",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimTreasuryPayment",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOperator",
    inputs: [{ name: "newOperator", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "acceptOperator",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// ============================================
// ERC20 MINIMAL ABI (for balance/allowance reads)
// ============================================
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;

// ============================================
// ACCESS CONTROL ABI (for hasRole checks)
// ============================================
export const ACCESS_CONTROL_ABI = [
  {
    type: "function",
    name: "hasRole",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;

// keccak256("MINTER_ROLE")
export const MINTER_ROLE =
  "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6" as const;

// ============================================
// PERMIT2 ABI (minimal for approve + allowance)
// ============================================
export const PERMIT2_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint160", internalType: "uint160" },
      { name: "expiration", type: "uint48", internalType: "uint48" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "token", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "amount", type: "uint160", internalType: "uint160" },
      { name: "expiration", type: "uint48", internalType: "uint48" },
      { name: "nonce", type: "uint48", internalType: "uint48" },
    ],
    stateMutability: "view",
  },
] as const;

// Canonical Permit2 address (same on all chains)
export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

// ============================================
// ERC20 EXTENDED ABI (approve + metadata)
// ============================================
export const ERC20_EXTENDED_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
] as const;

// ============================================
// CCA AUCTION ABI
// ============================================
export const CCA_AUCTION_ABI = [
  // Errors
  { type: "error", name: "InvalidTokenAmountReceived", inputs: [] },
  { type: "error", name: "InvalidAmount", inputs: [] },
  { type: "error", name: "BidOwnerCannotBeZeroAddress", inputs: [] },
  { type: "error", name: "BidMustBeAboveClearingPrice", inputs: [] },
  {
    type: "error",
    name: "InvalidBidPriceTooHigh",
    inputs: [
      { name: "maxPrice", type: "uint256" },
      { name: "maxBidPrice", type: "uint256" },
    ],
  },
  { type: "error", name: "BidAmountTooSmall", inputs: [] },
  { type: "error", name: "CurrencyIsNotNative", inputs: [] },
  { type: "error", name: "AuctionNotStarted", inputs: [] },
  { type: "error", name: "TokensNotReceived", inputs: [] },
  { type: "error", name: "ClaimBlockIsBeforeEndBlock", inputs: [] },
  {
    type: "error",
    name: "FloorPriceAndTickSpacingGreaterThanMaxBidPrice",
    inputs: [
      { name: "nextTick", type: "uint256" },
      { name: "maxBidPrice", type: "uint256" },
    ],
  },
  { type: "error", name: "FloorPriceAndTickSpacingTooLarge", inputs: [] },
  { type: "error", name: "BidAlreadyExited", inputs: [] },
  { type: "error", name: "CannotExitBid", inputs: [] },
  { type: "error", name: "CannotPartiallyExitBidBeforeEndBlock", inputs: [] },
  { type: "error", name: "InvalidLastFullyFilledCheckpointHint", inputs: [] },
  { type: "error", name: "InvalidOutbidBlockCheckpointHint", inputs: [] },
  { type: "error", name: "NotClaimable", inputs: [] },
  {
    type: "error",
    name: "BatchClaimDifferentOwner",
    inputs: [
      { name: "expectedOwner", type: "address" },
      { name: "receivedOwner", type: "address" },
    ],
  },
  { type: "error", name: "BidNotExited", inputs: [] },
  { type: "error", name: "CannotPartiallyExitBidBeforeGraduation", inputs: [] },
  { type: "error", name: "TokenTransferFailed", inputs: [] },
  { type: "error", name: "AuctionIsNotOver", inputs: [] },
  { type: "error", name: "InvalidBidUnableToClear", inputs: [] },
  { type: "error", name: "AuctionSoldOut", inputs: [] },
  { type: "error", name: "BidIdDoesNotExist", inputs: [{ name: "bidId", type: "uint256" }] },

  // View Functions
  {
    type: "function",
    name: "MAX_BID_PRICE",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "token",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currency",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "startBlock",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "endBlock",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimBlock",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "floorPrice",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tickSpacing",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "clearingPrice",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currencyRaised",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isGraduated",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokensRecipient",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "fundsRecipient",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "validationHook",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextBidId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "bids",
    inputs: [{ name: "bidId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct Bid",
        components: [
          { name: "startBlock", type: "uint64", internalType: "uint64" },
          { name: "startCumulativeMps", type: "uint24", internalType: "uint24" },
          { name: "exitedBlock", type: "uint64", internalType: "uint64" },
          { name: "maxPrice", type: "uint256", internalType: "uint256" },
          { name: "owner", type: "address", internalType: "address" },
          { name: "amountQ96", type: "uint256", internalType: "uint256" },
          { name: "tokensFilled", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },

  // Write Functions
  {
    type: "function",
    name: "submitBid",
    inputs: [
      { name: "maxPrice", type: "uint256" },
      { name: "amount", type: "uint128" },
      { name: "owner", type: "address" },
      { name: "hookData", type: "bytes" },
    ],
    outputs: [{ name: "bidId", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "exitBid",
    inputs: [{ name: "bidId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "exitPartiallyFilledBid",
    inputs: [
      { name: "bidId", type: "uint256", internalType: "uint256" },
      { name: "lastFullyFilledCheckpointBlock", type: "uint64", internalType: "uint64" },
      { name: "outbidBlock", type: "uint64", internalType: "uint64" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimTokens",
    inputs: [{ name: "bidId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimTokensBatch",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "bidIds", type: "uint256[]", internalType: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkpoint",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "clearingPrice", type: "uint256" },
          { name: "totalCleared", type: "uint256" },
          { name: "availableSupply", type: "uint256" },
          { name: "cumulativeMps", type: "uint24" },
          { name: "lastCheckpointBlock", type: "uint64" },
          { name: "currentStepEndBlock", type: "uint64" },
        ],
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sweepUnsoldTokens",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sweepCurrency",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Events
  {
    type: "event",
    name: "TokensReceived",
    inputs: [{ name: "totalSupply", type: "uint128", indexed: false }],
  },
  {
    type: "event",
    name: "BidSubmitted",
    inputs: [
      { name: "bidId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "maxPrice", type: "uint256", indexed: false },
      { name: "amount", type: "uint128", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BidExited",
    inputs: [
      { name: "bidId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "tokensFilled", type: "uint256", indexed: false },
      { name: "refund", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TokensClaimed",
    inputs: [
      { name: "bidId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "tokensFilled", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ClearingPriceUpdated",
    inputs: [
      { name: "blockNumber", type: "uint64", indexed: false },
      { name: "clearingPrice", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CheckpointUpdated",
    inputs: [
      { name: "blockNumber", type: "uint64", indexed: false },
      { name: "clearingPrice", type: "uint256", indexed: false },
      { name: "cumulativeMps", type: "uint24", indexed: false },
    ],
  },
] as const;
