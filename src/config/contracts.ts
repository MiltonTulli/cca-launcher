import { Address } from "viem";

// ============================================
// SEPOLIA TEST CONTRACTS (from Happy Path Test Plan)
// ============================================
const DEPLOYMENTS = {
  V1: {
    TestUSDC: "0x0B50239E3731956F90fC52eF07c55C0631A004D2" as Address,
    SaleToken: "0x39BBeB53c8e9c2A1dE04644FBcF9Ebf5dF396080" as Address,
    PermitterFactory: "0x1CAc31307b284a18c59437Df1dF4b90ABa0c0c99" as Address,
    LockupContract: "0xe5b496e97F364f6f1567D67D8523Bb6d89dc4413" as Address,
    TallyLaunchFactory: "0x6f32468767bBb1BC4516fA50420FD14C75c26d60" as Address,
  },
  V2: {
    TestUSDC: "0x5578B6F76fa18fb9E76091a9e60D190fC6045f18" as Address,
    SaleToken: "0x585ef9558aFd1c9eeDCe9FeD6fdf990Ea9Ffe123" as Address,
    PermitterFactory: "0xfC3F4E31Fc5d46FD8D8eb74b17dBc60Bb02daED4" as Address,
    LockupContract: "0xB45707e755cec36c0013aBA68FeA6A54753606d1" as Address,
    TallyLaunchFactory: "0xDfe0F10dFA7c05423752b2AEfa6eD7Bad58fF084" as Address,
  }
}
export const SEPOLIA_CONTRACTS = {
  ...DEPLOYMENTS.V2,
} as const;

// ============================================
// TOKEN SOURCE ENUM
// ============================================
export enum TokenSource {
  MINT = 0,
  PERMIT2 = 1,
  TRANSFER = 2,
}

export const TOKEN_SOURCE_OPTIONS = [
  { value: TokenSource.MINT, label: "Mint", description: "Factory mints tokens" },
  { value: TokenSource.PERMIT2, label: "Permit2", description: "Transfer via Permit2 approval" },
  { value: TokenSource.TRANSFER, label: "Transfer", description: "Direct transfer to orchestrator" },
] as const;

// ============================================
// TICK SPACING (must match pool fee tier)
// ============================================
export const TICK_SPACING_BY_FEE: Record<number, number> = {
  100: 1,    // 0.01% fee tier
  500: 10,   // 0.05% fee tier
  3000: 60,  // 0.30% fee tier
  10000: 200, // 1.00% fee tier
};

// ============================================
// TallyLaunchFactory ABI (UPDATED with new fields)
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
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "BASIS_POINTS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_AUCTION_DURATION",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_DISTRIBUTION_DELAY",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_LOCKUP_DURATION",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_PLATFORM_FEE_ON_LP_FEES",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_PRICING_STEPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_AUCTION_DURATION",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_PRICING_STEPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
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
          { name: "liquidityManager", type: "address", internalType: "address" },
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
      { name: "launcherAddress", type: "address", indexed: true, internalType: "address" },
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
    type: "error",
    name: "InvalidAllocationSplit",
    inputs: [
      { name: "liquidityAllocation", type: "uint256", internalType: "uint256" },
      { name: "treasuryAllocation", type: "uint256", internalType: "uint256" },
      { name: "total", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "InvalidAuctionDuration",
    inputs: [{ name: "duration", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "InvalidDistributionDelay",
    inputs: [
      { name: "delay", type: "uint256", internalType: "uint256" },
      { name: "maxDelay", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "InvalidLockupDuration",
    inputs: [
      { name: "duration", type: "uint256", internalType: "uint256" },
      { name: "maxDuration", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "InvalidPlatformFeeOnLPFees",
    inputs: [
      { name: "fee", type: "uint256", internalType: "uint256" },
      { name: "maxFee", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "InvalidPoolFeeTier",
    inputs: [{ name: "tier", type: "uint24", internalType: "uint24" }],
  },
  {
    type: "error",
    name: "InvalidPricingSteps",
    inputs: [{ name: "steps", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "ReservePriceBelowMinimum",
    inputs: [
      { name: "provided", type: "uint256", internalType: "uint256" },
      { name: "minimum", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "PricingStepsExceedAuctionBlocks",
    inputs: [
      { name: "pricingSteps", type: "uint256", internalType: "uint256" },
      { name: "auctionBlocks", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "NotPlatformAdmin",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: [],
  },
] as const;

// ============================================
// CONTRACT ADDRESSES PER NETWORK
// ============================================
export const TALLY_LAUNCH_FACTORY_ADDRESSES: Record<number, Address> = {
  1: "0x0000000000000000000000000000000000000000", // Mainnet - TBD
  11155111: SEPOLIA_CONTRACTS.TallyLaunchFactory, // Sepolia
  8453: "0x0000000000000000000000000000000000000000", // Base - TBD
  84532: "0x0000000000000000000000000000000000000000", // Base Sepolia - TBD
};

// ============================================
// POOL FEE TIERS
// ============================================
export const POOL_FEE_TIERS = [
  { value: 100, label: "0.01% - Stablecoins", tickSpacing: 1 },
  { value: 500, label: "0.05% - Correlated pairs", tickSpacing: 10 },
  { value: 3000, label: "0.30% - Standard", tickSpacing: 60 },
  { value: 10000, label: "1.00% - Exotic pairs", tickSpacing: 200 },
] as const;

// ============================================
// VALIDATION CONSTANTS
// ============================================
export const LAUNCH_CONSTRAINTS = {
  MIN_AUCTION_DURATION: 3600, // 1 hour in seconds
  MAX_AUCTION_DURATION: 2592000, // 30 days in seconds
  MIN_PRICING_STEPS: 1,
  MAX_PRICING_STEPS: 1000,
  MAX_LOCKUP_DURATION: 63072000, // 730 days (2 years) in seconds
  MAX_DISTRIBUTION_DELAY: 2592000, // 30 days in seconds
  BASIS_POINTS: 10000,
} as const;

// ============================================
// TYPES
// ============================================

// LaunchParams type (matches contract struct)
export interface LaunchParams {
  tokenSource: TokenSource;
  tokenAmount: bigint;
  auctionDuration: bigint;
  pricingSteps: bigint;
  reservePrice: bigint;
  startTime: bigint;
  liquidityAllocation: bigint;
  treasuryAllocation: bigint;
  treasury: Address;
  poolFeeTier: number;
  tickSpacing: number;
  lockupDuration: bigint;
  distributionDelay: bigint;
  positionBeneficiary: Address;
  validationHook: Address;
  liquidityManager: Address;
}

// Form values type (user-friendly)
export interface LaunchFormValues {
  // Token config
  token: string;
  paymentToken: string;
  operator: string;
  tokenSource: string;
  tokenAmount: string;
  tokenDecimals: string;
  paymentTokenDecimals: string;
  // Auction config
  auctionDurationDays: string;
  auctionDurationHours: string;
  pricingSteps: string;
  reservePrice: string;
  startTime: string; // "0" for immediate, or ISO timestamp
  // Allocation
  liquidityAllocationPercent: string;
  treasuryAllocationPercent: string;
  treasury: string;
  // Pool config
  poolFeeTier: string;
  tickSpacing: string;
  // Lockup config
  lockupDurationDays: string;
  distributionDelayDays: string;
  positionBeneficiary: string;
  // Validation
  validationHook: string;
  // Liquidity management
  liquidityManager: string;
}

// ============================================
// DEFAULT FORM VALUES
// ============================================
export const DEFAULT_FORM_VALUES: LaunchFormValues = {
  token: "",
  paymentToken: "",
  operator: "",
  tokenSource: TokenSource.TRANSFER.toString(),
  tokenAmount: "",
  tokenDecimals: "18",
  paymentTokenDecimals: "18",
  auctionDurationDays: "7",
  auctionDurationHours: "0",
  pricingSteps: "100",
  reservePrice: "",
  startTime: "0",
  liquidityAllocationPercent: "50",
  treasuryAllocationPercent: "50",
  treasury: "",
  poolFeeTier: "3000",
  tickSpacing: "60",
  lockupDurationDays: "180",
  distributionDelayDays: "0",
  positionBeneficiary: "",
  validationHook: "0x0000000000000000000000000000000000000000",
  liquidityManager: "0x0000000000000000000000000000000000000000",
};

// ============================================
// PRESETS (from Happy Path Test Plan)
// ============================================
export interface LaunchPreset {
  id: string;
  name: string;
  description: string;
  values: Partial<LaunchFormValues>;
}

export const LAUNCH_PRESETS: LaunchPreset[] = [
  {
    id: "test-case-1",
    name: "Test Case 1: Basic Launch",
    description: "1M SALE tokens, 1 hour auction, 50/50 split, 0.3% fee tier",
    values: {
      token: SEPOLIA_CONTRACTS.SaleToken,
      paymentToken: SEPOLIA_CONTRACTS.TestUSDC,
      tokenSource: TokenSource.TRANSFER.toString(),
      tokenAmount: "1000000",
      tokenDecimals: "18",
      paymentTokenDecimals: "6",
      auctionDurationDays: "0",
      auctionDurationHours: "1",
      pricingSteps: "100",
      reservePrice: "0.1", // 0.10 USDC per SALE (in payment token decimals)
      startTime: "0",
      liquidityAllocationPercent: "50",
      treasuryAllocationPercent: "50",
      poolFeeTier: "3000",
      tickSpacing: "60",
      lockupDurationDays: "0", // 5 minutes for testing (will convert to seconds)
      distributionDelayDays: "0",
      validationHook: "0x0000000000000000000000000000000000000000",
      liquidityManager: "0x0000000000000000000000000000000000000000",
    },
  },
  {
    id: "production-launch",
    name: "Production Launch",
    description: "7 day auction, 80/20 liquidity split, 6 month lockup",
    values: {
      tokenSource: TokenSource.TRANSFER.toString(),
      tokenDecimals: "18",
      paymentTokenDecimals: "18",
      auctionDurationDays: "7",
      auctionDurationHours: "0",
      pricingSteps: "500",
      startTime: "0",
      liquidityAllocationPercent: "80",
      treasuryAllocationPercent: "20",
      poolFeeTier: "3000",
      tickSpacing: "60",
      lockupDurationDays: "180",
      distributionDelayDays: "1",
      validationHook: "0x0000000000000000000000000000000000000000",
      liquidityManager: "0x0000000000000000000000000000000000000000",
    },
  },
  {
    id: "quick-test",
    name: "Quick Test (Sepolia)",
    description: "Minimum duration, short lockup, pre-filled test tokens",
    values: {
      token: SEPOLIA_CONTRACTS.SaleToken,
      paymentToken: SEPOLIA_CONTRACTS.TestUSDC,
      tokenSource: TokenSource.TRANSFER.toString(),
      tokenAmount: "10000",
      tokenDecimals: "18",
      paymentTokenDecimals: "6",
      auctionDurationDays: "0",
      auctionDurationHours: "1",
      pricingSteps: "10",
      reservePrice: "0.01",
      startTime: "0",
      liquidityAllocationPercent: "50",
      treasuryAllocationPercent: "50",
      poolFeeTier: "3000",
      tickSpacing: "60",
      lockupDurationDays: "0",
      distributionDelayDays: "0",
      validationHook: "0x0000000000000000000000000000000000000000",
      liquidityManager: "0x0000000000000000000000000000000000000000",
    },
  },
];

// ============================================
// WIZARD STEPS (from Happy Path Test Plan)
// ============================================
export const WIZARD_STEPS = [
  {
    id: "setup",
    number: 1,
    title: "Setup",
    description: "Configure tokens and mint/transfer to operator",
  },
  {
    id: "create-permitter",
    number: 2,
    title: "Permitter (Optional)",
    description: "Create validation hook if needed",
  },
  {
    id: "create-launch",
    number: 3,
    title: "Create Launch",
    description: "Deploy orchestrator via factory",
  },
  {
    id: "fund-auction",
    number: 4,
    title: "Fund & Start",
    description: "Transfer tokens and start auction",
  },
  {
    id: "place-bids",
    number: 5,
    title: "Place Bids",
    description: "Bidders submit bids through CCA",
  },
  {
    id: "finalize",
    number: 6,
    title: "Finalize",
    description: "End auction and determine clearing price",
  },
  {
    id: "distribute",
    number: 7,
    title: "Distribute",
    description: "Distribute tokens and create LP",
  },
  {
    id: "verify-lockup",
    number: 8,
    title: "Verify Lockup",
    description: "Confirm position lock and fee collection",
  },
  {
    id: "unlock",
    number: 9,
    title: "Unlock",
    description: "Withdraw position after lockup period",
  },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

// ============================================
// LAUNCH STATE ENUM (matches contract)
// ============================================
export enum LaunchState {
  SETUP = 0,
  FINALIZED = 1,
  AUCTION_ACTIVE = 2,
  AUCTION_ENDED = 3,
  AUCTION_FAILED = 4,
  DISTRIBUTED = 5,
  LOCKED = 6,
  UNLOCKED = 7,
}

export const LAUNCH_STATE_LABELS: Record<LaunchState, string> = {
  [LaunchState.SETUP]: "Setup",
  [LaunchState.FINALIZED]: "Finalized",
  [LaunchState.AUCTION_ACTIVE]: "Auction Active",
  [LaunchState.AUCTION_ENDED]: "Auction Ended",
  [LaunchState.AUCTION_FAILED]: "Auction Failed",
  [LaunchState.DISTRIBUTED]: "Distributed",
  [LaunchState.LOCKED]: "Locked",
  [LaunchState.UNLOCKED]: "Unlocked",
};

export const LAUNCH_STATE_COLORS: Record<LaunchState, string> = {
  [LaunchState.SETUP]: "bg-gray-100 text-gray-700",
  [LaunchState.FINALIZED]: "bg-blue-100 text-blue-700",
  [LaunchState.AUCTION_ACTIVE]: "bg-green-100 text-green-700",
  [LaunchState.AUCTION_ENDED]: "bg-yellow-100 text-yellow-700",
  [LaunchState.AUCTION_FAILED]: "bg-red-100 text-red-700",
  [LaunchState.DISTRIBUTED]: "bg-purple-100 text-purple-700",
  [LaunchState.LOCKED]: "bg-orange-100 text-orange-700",
  [LaunchState.UNLOCKED]: "bg-green-100 text-green-700",
};

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
  {
    type: "function",
    name: "liquidityManager",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateLiquidityManager",
    inputs: [{ name: "newManager", type: "address", internalType: "address" }],
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
export const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6" as const;
