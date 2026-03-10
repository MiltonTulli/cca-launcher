import type { TokenSource } from "./enums";

// ============================================
// CONTRACT-LEVEL TYPES
// ============================================

/** LaunchParams type — matches the contract struct used in createLaunch() */
export interface LaunchParams {
  tokenSource: TokenSource;
  tokenAmount: bigint;
  auctionDuration: bigint;
  pricingSteps: bigint;
  reservePrice: bigint;
  startTime: bigint;
  liquidityAllocation: bigint;
  treasuryAllocation: bigint;
  treasury: `0x${string}`;
  poolFeeTier: number;
  tickSpacing: number;
  lockupDuration: bigint;
  distributionDelay: bigint;
  positionBeneficiary: `0x${string}`;
  validationHook: `0x${string}`;
}

/** On-chain Bid struct from CCA contract */
export interface CCABidStruct {
  startBlock: bigint;
  startCumulativeMps: number;
  exitedBlock: bigint;
  maxPrice: bigint;
  owner: `0x${string}`;
  amountQ96: bigint;
  tokensFilled: bigint;
}

// ============================================
// CONSTANTS
// ============================================

/** Uniswap V4 tick spacing per fee tier */
export const TICK_SPACING_BY_FEE: Record<number, number> = {
  100: 1, // 0.01%
  500: 10, // 0.05%
  3000: 60, // 0.30%
  10000: 200, // 1.00%
};

/** Available pool fee tiers */
export const POOL_FEE_TIERS = [
  { value: 100, label: "0.01%", tickSpacing: 1 },
  { value: 500, label: "0.05%", tickSpacing: 10 },
  { value: 3000, label: "0.30%", tickSpacing: 60 },
  { value: 10000, label: "1.00%", tickSpacing: 200 },
] as const;

/** Launch validation constraints */
export const LAUNCH_CONSTRAINTS = {
  MIN_AUCTION_DURATION: 3600, // 1 hour
  MAX_AUCTION_DURATION: 2592000, // 30 days
  MIN_PRICING_STEPS: 1,
  MAX_PRICING_STEPS: 1000,
  MAX_LOCKUP_DURATION: 63072000, // 730 days
  MAX_DISTRIBUTION_DELAY: 2592000, // 30 days
  BASIS_POINTS: 10000,
} as const;

/** Block time per chain (seconds) */
export const BLOCK_TIME_SECONDS: Record<number, number> = {
  1: 12, // Ethereum mainnet
  11155111: 12, // Sepolia
  42161: 0.25, // Arbitrum One
  421614: 0.25, // Arbitrum Sepolia
};

export const DEFAULT_BLOCK_TIME = 12;

/** Q96 fixed-point constant (2^96) */
export const Q96 = BigInt("79228162514264337593543950336");
