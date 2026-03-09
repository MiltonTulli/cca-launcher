"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { formatUnits } from "viem";
import { InfoRow } from "@/components/InfoRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LaunchState } from "@/config/contracts";
import { formatCountdown, ZERO_ADDRESS } from "@/lib/utils";
import type { DistributionInfo, LaunchInfo } from "./types";

interface DistributionInfoCardProps {
  distInfo: DistributionInfo | undefined;
  launchInfo: LaunchInfo;
  currentState: LaunchState;
  isPermissionless: boolean | undefined;
  explorerUrl: string;
  now: number;
}

export function DistributionInfoCard({
  distInfo,
  launchInfo,
  currentState,
  isPermissionless,
  explorerUrl,
  now,
}: DistributionInfoCardProps) {
  if (currentState < LaunchState.AUCTION_ENDED || !distInfo) return null;

  const unlockTime = Number(launchInfo.unlockTime);
  const unlockRemaining = unlockTime > now ? unlockTime - now : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoRow label="Total Raised" value={formatUnits(distInfo.totalRaised, 18)} />
          <InfoRow label="Tokens Sold" value={formatUnits(distInfo.tokensSold, 18)} />
          <InfoRow label="Treasury Paid" value={formatUnits(distInfo.treasuryPaid, 18)} />
          <InfoRow label="Liquidity Created" value={formatUnits(distInfo.liquidityCreated, 18)} />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Liquidity Complete</span>
            {distInfo.liquidityComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Treasury Complete</span>
            {distInfo.treasuryComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          {distInfo.lockupContract !== ZERO_ADDRESS && (
            <InfoRow
              label="Lockup Contract"
              value={distInfo.lockupContract}
              isAddress
              explorerUrl={explorerUrl}
            />
          )}
          {distInfo.positionTokenId > BigInt(0) && (
            <InfoRow label="Position Token ID" value={distInfo.positionTokenId.toString()} />
          )}
          {unlockTime > 0 && currentState === LaunchState.LOCKED && (
            <div className="sm:col-span-2 rounded-lg bg-orange-50 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Unlock In</p>
              <p className="text-xl font-bold font-mono">
                {unlockRemaining > 0 ? formatCountdown(unlockRemaining) : "Unlockable now"}
              </p>
            </div>
          )}
          {isPermissionless !== undefined && (
            <InfoRow label="Permissionless Distribution" value={isPermissionless ? "Yes" : "No"} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
