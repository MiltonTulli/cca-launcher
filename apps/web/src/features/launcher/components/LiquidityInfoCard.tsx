"use client";

import { LiquidityState } from "@launcher/sdk";
import type { LaunchData } from "../utils/fromLaunchData";
import { AddressLink } from "@/components/AddressLink";
import { InfoRow } from "@/components/InfoRow";
import { LiquidityStateBadge } from "./StateBadge";

interface LiquidityInfoCardProps {
  launchData: LaunchData;
  chainId?: number;
}

export function LiquidityInfoCard({ launchData, chainId }: LiquidityInfoCardProps) {
  const { liquidityInfo } = launchData;

  if (!liquidityInfo || liquidityInfo.state === LiquidityState.NONE) {
    return null;
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Liquidity Position</h3>
        <LiquidityStateBadge state={liquidityInfo.state} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Vault</span>
          <AddressLink address={liquidityInfo.vault} chainId={chainId} />
        </div>
        <InfoRow label="Position NFT ID" value={liquidityInfo.positionTokenId.toString()} />

        {liquidityInfo.lockup !== "0x0000000000000000000000000000000000000000" && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lockup Contract</span>
            <AddressLink address={liquidityInfo.lockup} chainId={chainId} />
          </div>
        )}

        {liquidityInfo.state === LiquidityState.LOCKED && (
          <InfoRow
            label="Unlocks At"
            value={new Date(Number(liquidityInfo.unlockTimestamp) * 1000).toLocaleString()}
          />
        )}

        {liquidityInfo.state === LiquidityState.UNLOCKED && (
          <p className="text-sm text-green-600">Position is unlocked and can be withdrawn.</p>
        )}

        {liquidityInfo.state === LiquidityState.WITHDRAWN && (
          <p className="text-sm text-muted-foreground">Position has been withdrawn.</p>
        )}

        <div className="border-t pt-2 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Fee Split</p>
          <InfoRow label="Platform Fee" value={`${(launchData.lpFeeShareBps / 100).toFixed(1)}%`} />
          <InfoRow label="Creator Fee" value={`${((10000 - launchData.lpFeeShareBps) / 100).toFixed(1)}%`} />
        </div>
      </div>
    </div>
  );
}
