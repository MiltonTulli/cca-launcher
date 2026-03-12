"use client";

import type { LaunchData } from "../utils/fromLaunchData";
import { AddressLink } from "@/components/AddressLink";
import { InfoRow } from "@/components/InfoRow";
import type { EffectiveLaunchState } from "../utils/displayState";

interface AuctionInfoCardProps {
  launchData: LaunchData;
  effectiveState: EffectiveLaunchState;
  blockNumber?: bigint;
  chainId?: number;
}

export function AuctionInfoCard({ launchData, effectiveState, blockNumber, chainId }: AuctionInfoCardProps) {
  const auctionActive = effectiveState === "AUCTION_ACTIVE";
  const progress = blockNumber && launchData.auctionStartBlock > BigInt(0)
    ? Number(blockNumber - launchData.auctionStartBlock) / Number(launchData.auctionEndBlockConfig - launchData.auctionStartBlock) * 100
    : 0;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold">Auction Info</h3>
      <div className="space-y-2">
        <InfoRow label="Start Block" value={launchData.auctionStartBlock.toString()} />
        <InfoRow label="End Block" value={launchData.auctionEndBlockConfig.toString()} />
        <InfoRow label="Claim Block" value={launchData.claimBlock.toString()} />
        <InfoRow label="Reserve Price" value={launchData.reservePrice.toString()} />
        <InfoRow label="Auction Tokens" value={launchData.auctionTokenAmount.toString()} />
        {launchData.cca !== "0x0000000000000000000000000000000000000000" && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">CCA Address</span>
            <AddressLink address={launchData.cca} chainId={chainId} />
          </div>
        )}
        {launchData.totalRaised > BigInt(0) && (
          <>
            <InfoRow label="Total Raised" value={launchData.totalRaised.toString()} />
            <InfoRow label="Tokens Sold" value={launchData.tokensSold.toString()} />
          </>
        )}
      </div>

      {/* Progress bar for active auction */}
      {auctionActive && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.min(100, Math.max(0, progress)).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
