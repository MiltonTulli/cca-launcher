// ============================================
// TOKEN SOURCE ENUM (matches contract TokenSource)
// ============================================
export enum TokenSource {
  EXISTING_BALANCE = 0,
  EXISTING_TRANSFER_FROM = 1,
  CREATE_NEW = 2,
}

// ============================================
// LAUNCH STATE ENUM (matches contract LaunchState)
// Note: AUCTION_ACTIVE is derived in UI (FINALIZED + block in range), not stored on-chain
// ============================================
export enum LaunchState {
  SETUP = 0,
  FINALIZED = 1,
  AUCTION_ENDED = 2,
  DISTRIBUTED = 3,
  CANCELLED = 4,
  AUCTION_FAILED = 5,
}

// ============================================
// LIQUIDITY STATE ENUM (separate from LaunchState)
// ============================================
export enum LiquidityState {
  NONE = 0,
  LOCKED = 1,
  UNLOCKED = 2,
  WITHDRAWN = 3,
}

// ============================================
// CCA PHASE ENUM
// ============================================
export enum CCAPhase {
  COMING_SOON = 0,
  LIVE = 1,
  ENDED = 2,
  CLAIMABLE = 3,
  FAILED = 4,
}

// ============================================
// BID STATUS ENUM
// ============================================
export enum BidStatus {
  ACTIVE = "ACTIVE",
  EXITED = "EXITED",
  CLAIMED = "CLAIMED",
}
