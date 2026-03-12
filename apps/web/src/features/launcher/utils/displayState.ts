import { LaunchState, LiquidityState, TokenSource } from "../config";

/** Extended state that includes derived AUCTION_ACTIVE */
export type EffectiveLaunchState = LaunchState | "AUCTION_ACTIVE";

/**
 * Derives the effective state, detecting AUCTION_ACTIVE when the on-chain
 * state is FINALIZED but the current block falls within the auction window.
 */
export function getEffectiveState(
  state: LaunchState,
  currentBlock: bigint,
  startBlock: bigint,
  endBlock: bigint
): EffectiveLaunchState {
  if (
    state === LaunchState.FINALIZED &&
    currentBlock >= startBlock &&
    currentBlock <= endBlock
  ) {
    return "AUCTION_ACTIVE";
  }
  return state;
}

/** Human-readable labels for each launch state */
export const LAUNCH_STATE_LABELS: Record<EffectiveLaunchState, string> = {
  [LaunchState.SETUP]: "Setup",
  [LaunchState.FINALIZED]: "Finalized",
  AUCTION_ACTIVE: "Auction Active",
  [LaunchState.AUCTION_ENDED]: "Auction Ended",
  [LaunchState.DISTRIBUTED]: "Distributed",
  [LaunchState.CANCELLED]: "Cancelled",
  [LaunchState.AUCTION_FAILED]: "Auction Failed",
};

/** Tailwind color classes for each launch state */
export const LAUNCH_STATE_COLORS: Record<EffectiveLaunchState, string> = {
  [LaunchState.SETUP]: "bg-gray-100 text-gray-800",
  [LaunchState.FINALIZED]: "bg-blue-100 text-blue-800",
  AUCTION_ACTIVE: "bg-indigo-100 text-indigo-800",
  [LaunchState.AUCTION_ENDED]: "bg-purple-100 text-purple-800",
  [LaunchState.DISTRIBUTED]: "bg-green-100 text-green-800",
  [LaunchState.CANCELLED]: "bg-yellow-100 text-yellow-800",
  [LaunchState.AUCTION_FAILED]: "bg-red-100 text-red-800",
};

/** Returns label and className for rendering a state badge */
export function getStateBadgeProps(state: EffectiveLaunchState): {
  label: string;
  className: string;
} {
  return {
    label: LAUNCH_STATE_LABELS[state],
    className: LAUNCH_STATE_COLORS[state],
  };
}

/** Human-readable labels for liquidity states */
export const LIQUIDITY_STATE_LABELS: Record<LiquidityState, string> = {
  [LiquidityState.NONE]: "None",
  [LiquidityState.LOCKED]: "Locked",
  [LiquidityState.UNLOCKED]: "Unlocked",
  [LiquidityState.WITHDRAWN]: "Withdrawn",
};

/** Tailwind color classes for liquidity states */
export const LIQUIDITY_STATE_COLORS: Record<LiquidityState, string> = {
  [LiquidityState.NONE]: "bg-gray-100 text-gray-800",
  [LiquidityState.LOCKED]: "bg-blue-100 text-blue-800",
  [LiquidityState.UNLOCKED]: "bg-green-100 text-green-800",
  [LiquidityState.WITHDRAWN]: "bg-yellow-100 text-yellow-800",
};

/** Returns label and className for rendering a liquidity state badge */
export function getLiquidityStateBadgeProps(state: LiquidityState): {
  label: string;
  className: string;
} {
  return {
    label: LIQUIDITY_STATE_LABELS[state],
    className: LIQUIDITY_STATE_COLORS[state],
  };
}

/**
 * Returns the appropriate label for the distribution action button
 * based on operator status and permissionless availability.
 */
export function getDistributionAccessLabel(
  isOperator: boolean,
  isPermissionless: boolean
): string {
  if (isOperator) {
    return "Process Distribution";
  }
  if (isPermissionless) {
    return "Process Distribution (permissionless)";
  }
  return "Distribution available in X blocks";
}

/** Options for the token source select input */
export const TOKEN_SOURCE_OPTIONS = [
  { value: TokenSource.EXISTING_BALANCE, label: "Existing Balance" },
  { value: TokenSource.EXISTING_TRANSFER_FROM, label: "Transfer From (approve)" },
  { value: TokenSource.CREATE_NEW, label: "Create New Token" },
] as const;
