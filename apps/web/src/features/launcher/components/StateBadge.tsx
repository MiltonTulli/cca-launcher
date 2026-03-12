"use client";

import { getStateBadgeProps, getLiquidityStateBadgeProps, type EffectiveLaunchState } from "../utils/displayState";
import { type LiquidityState } from "@launcher/sdk";

export function LaunchStateBadge({ state }: { state: EffectiveLaunchState }) {
  const { label, className } = getStateBadgeProps(state);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function LiquidityStateBadge({ state }: { state: LiquidityState }) {
  const { label, className } = getLiquidityStateBadgeProps(state);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
