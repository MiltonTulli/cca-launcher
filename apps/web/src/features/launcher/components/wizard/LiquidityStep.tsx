"use client";

import { POOL_FEE_TIERS } from "@launcher/sdk";
import type { StepProps } from "./types";

export function LiquidityStep({ values, updateField }: StepProps) {
  return (
    <div className="space-y-8">
      {/* Enable toggle */}
      <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
        <input
          type="checkbox"
          checked={values.liquidityEnabled}
          onChange={(e) => updateField("liquidityEnabled", e.target.checked)}
          className="h-4 w-4"
        />
        <div>
          <p className="text-sm font-medium">Enable Liquidity Bootstrap</p>
          <p className="text-xs text-muted-foreground">
            Automatically deploy a Uniswap V3 liquidity position after distribution.
          </p>
        </div>
      </label>

      {!values.liquidityEnabled && (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
          Liquidity bootstrap is disabled. The auction proceeds will go directly to the treasury.
        </p>
      )}

      {values.liquidityEnabled && (
        <div className="space-y-8">
          {/* LP Allocation */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Token Allocation to LP (%)</label>
            <input
              type="range"
              min="0"
              max="80"
              step="1"
              value={values.liquidityPercent}
              onChange={(e) => updateField("liquidityPercent", e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{values.liquidityPercent}% to LP</span>
              <span>{100 - Number(values.liquidityPercent)}% to Auction</span>
            </div>
          </div>

          {/* Basic LP settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proceeds to Liquidity (%)</label>
              <input
                type="number"
                value={values.proceedsToLiquidityPercent}
                onChange={(e) => updateField("proceedsToLiquidityPercent", e.target.value)}
                min="0"
                max="100"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Percentage of auction proceeds paired with tokens for the LP.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pool Fee Tier</label>
              <select
                value={values.poolFeeTier}
                onChange={(e) => updateField("poolFeeTier", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {POOL_FEE_TIERS.map((tier) => (
                  <option key={tier.value} value={tier.value}>{tier.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced LP settings */}
          <details className="rounded-lg border p-4">
            <summary className="text-sm font-medium cursor-pointer select-none">
              Advanced Settings
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Tick Lower</label>
                  <input
                    type="number"
                    value={values.tickLower}
                    onChange={(e) => updateField("tickLower", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Tick Upper</label>
                  <input
                    type="number"
                    value={values.tickUpper}
                    onChange={(e) => updateField("tickUpper", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Position Beneficiary</label>
                <input
                  type="text"
                  value={values.positionBeneficiary}
                  onChange={(e) => updateField("positionBeneficiary", e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Address that will own the LP position NFT.
                </p>
              </div>

              {/* Lockup */}
              <label className="flex items-center gap-3 rounded border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={values.lockupEnabled}
                  onChange={(e) => updateField("lockupEnabled", e.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium">Enable Lockup</p>
                  <p className="text-xs text-muted-foreground">
                    Lock the LP position for a fixed period. Prevents early withdrawal.
                  </p>
                </div>
              </label>
              {values.lockupEnabled && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Lockup Duration (days)</label>
                  <input
                    type="number"
                    value={values.lockupDurationDays}
                    onChange={(e) => updateField("lockupDurationDays", e.target.value)}
                    min="0"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
