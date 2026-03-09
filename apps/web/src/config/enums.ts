// ============================================
// TOKEN SOURCE ENUM
// ============================================
export enum TokenSource {
  MINT = 0,
  TRANSFER_FROM = 1,
  TRANSFER = 2,
}

export const TOKEN_SOURCE_OPTIONS = [
  { value: TokenSource.MINT, label: "Mint", description: "Factory mints tokens" },
  {
    value: TokenSource.TRANSFER_FROM,
    label: "Transfer From",
    description: "Pull via transferFrom (requires approval)",
  },
  {
    value: TokenSource.TRANSFER,
    label: "Transfer",
    description: "Direct transfer to orchestrator",
  },
] as const;

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
// CCA PHASE ENUM
// ============================================
export enum CCAPhase {
  COMING_SOON = 0,
  LIVE = 1,
  ENDED = 2,
  CLAIMABLE = 3,
  FAILED = 4,
}

export const CCA_PHASE_LABELS: Record<CCAPhase, string> = {
  [CCAPhase.COMING_SOON]: "Coming Soon",
  [CCAPhase.LIVE]: "Live",
  [CCAPhase.ENDED]: "Ended",
  [CCAPhase.CLAIMABLE]: "Claimable",
  [CCAPhase.FAILED]: "Failed",
};

export const CCA_PHASE_COLORS: Record<CCAPhase, string> = {
  [CCAPhase.COMING_SOON]: "bg-blue-100 text-blue-700",
  [CCAPhase.LIVE]: "bg-green-100 text-green-700",
  [CCAPhase.ENDED]: "bg-yellow-100 text-yellow-700",
  [CCAPhase.CLAIMABLE]: "bg-purple-100 text-purple-700",
  [CCAPhase.FAILED]: "bg-red-100 text-red-700",
};

// ============================================
// BID STATUS ENUM
// ============================================
export enum BidStatus {
  ACTIVE = "ACTIVE",
  EXITED = "EXITED",
  CLAIMED = "CLAIMED",
}
