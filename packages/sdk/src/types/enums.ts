// ============================================
// TOKEN SOURCE ENUM (matches contract TokenSource)
// ============================================
export enum TokenSource {
  MINT = 0,
  TRANSFER_FROM = 1,
  TRANSFER = 2,
}

// ============================================
// LAUNCH STATE ENUM (matches contract LaunchState)
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
