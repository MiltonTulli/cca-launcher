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
// BLOCK TIME PER CHAIN (seconds)
// ============================================
export const BLOCK_TIME_SECONDS: Record<number, number> = {
  1: 12,         // Ethereum mainnet ~12s
  11155111: 12,  // Sepolia testnet ~12s
  42161: 0.25,   // Arbitrum One ~250ms
  421614: 0.25,  // Arbitrum Sepolia ~250ms
};

export const DEFAULT_BLOCK_TIME = 12;

// ============================================
// Q96 FIXED-POINT CONSTANT (2^96)
// ============================================
export const Q96 = BigInt("79228162514264337593543950336"); // 2^96
