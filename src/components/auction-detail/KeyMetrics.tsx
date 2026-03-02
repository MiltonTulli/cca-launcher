"use client";

import { formatUnits } from "viem";
import { CCAPhase, CCA_PHASE_LABELS, CCA_PHASE_COLORS } from "@/config/contracts";
import { q96PriceToDisplay, blocksToTimeEstimate } from "@/lib/q96";
import type { UseCCADataReturn } from "@/hooks/useCCAData";

interface KeyMetricsProps {
  data: UseCCADataReturn;
}

export function KeyMetrics({ data }: KeyMetricsProps) {
  const {
    phase,
    currentBlock,
    startBlock,
    endBlock,
    totalSupply,
    clearingPrice,
    currencyRaised,
    floorPrice,
    tokenDecimals,
    currencyDecimals,
    tokenSymbol,
    currencySymbol,
    chainId,
  } = data;

  const tDec = tokenDecimals ?? 18;
  const cDec = currencyDecimals ?? 18;
  const start = Number(startBlock ?? BigInt(0));
  const end = Number(endBlock ?? BigInt(0));
  const current = Number(currentBlock);
  const blocksRemaining = end > current ? end - current : 0;
  const totalBlocks = end - start;
  const progressPercent =
    totalBlocks > 0
      ? Math.min(100, Math.max(0, ((current - start) / totalBlocks) * 100))
      : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {(phase === CCAPhase.LIVE || phase === CCAPhase.COMING_SOON) && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CCA_PHASE_COLORS[phase]}`}
              >
                {phase === CCAPhase.LIVE && (
                  <span className="relative flex h-1.5 w-1.5 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                )}
                {CCA_PHASE_LABELS[phase]}
              </span>
              <span>Block {current.toLocaleString()}</span>
            </div>
            <span>
              {blocksRemaining > 0
                ? `${blocksRemaining.toLocaleString()} blocks remaining (${blocksToTimeEstimate(blocksRemaining, chainId)})`
                : "Ended"}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Tokens for Auction"
          value={
            totalSupply !== undefined
              ? `${formatUnits(totalSupply, tDec)} ${tokenSymbol ?? ""}`
              : "--"
          }
        />
        <MetricCard
          label="Total Raised"
          value={
            currencyRaised !== undefined
              ? `${formatUnits(currencyRaised, cDec)} ${currencySymbol ?? ""}`
              : "--"
          }
        />
        <MetricCard
          label="Floor Price"
          value={
            floorPrice !== undefined
              ? `${q96PriceToDisplay(floorPrice, tDec, cDec)} ${currencySymbol ?? ""}`
              : "--"
          }
        />
        <MetricCard
          label={phase >= CCAPhase.ENDED ? "Last Clearing Price" : "Clearing Price"}
          value={
            clearingPrice !== undefined && phase !== CCAPhase.COMING_SOON
              ? `${q96PriceToDisplay(clearingPrice, tDec, cDec)} ${currencySymbol ?? ""}`
              : "--"
          }
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-sm lg:text-base font-bold text-foreground font-mono truncate">
        {value}
      </div>
    </div>
  );
}
