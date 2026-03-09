"use client";

import { formatUnits } from "viem";
import { InfoRow } from "@/components/InfoRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LAUNCH_STATE_COLORS, LAUNCH_STATE_LABELS, type LaunchState } from "@/config/contracts";
import { formatBps, formatDuration } from "@/lib/utils";
import type { LaunchInfo } from "./types";

interface LaunchInfoCardProps {
  launchInfo: LaunchInfo;
  currentState: LaunchState;
  explorerUrl: string;
  tokenSymbol?: string;
  paymentTokenSymbol?: string;
}

export function LaunchInfoCard({
  launchInfo,
  currentState,
  explorerUrl,
  tokenSymbol,
  paymentTokenSymbol,
}: LaunchInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Launch Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium">State</span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${LAUNCH_STATE_COLORS[currentState]}`}
            >
              {LAUNCH_STATE_LABELS[currentState]}
            </span>
          </div>
          <InfoRow
            label="Token"
            value={launchInfo.token}
            isAddress
            explorerUrl={explorerUrl}
            prefix={tokenSymbol}
          />
          <InfoRow
            label="Payment Token"
            value={launchInfo.paymentToken}
            isAddress
            explorerUrl={explorerUrl}
            prefix={paymentTokenSymbol}
          />
          <InfoRow
            label="Operator"
            value={launchInfo.operator}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Treasury"
            value={launchInfo.treasury}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Beneficiary"
            value={launchInfo.positionBeneficiary}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Launcher"
            value={launchInfo.launcher}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow label="Liquidity Allocation" value={formatBps(launchInfo.liquidityAllocation)} />
          <InfoRow label="Treasury Allocation" value={formatBps(launchInfo.treasuryAllocation)} />
          <InfoRow
            label="Pool Fee Tier"
            value={`${(launchInfo.poolFeeTier / 10000).toFixed(2)}%`}
          />
          <InfoRow label="Tick Spacing" value={launchInfo.tickSpacing.toString()} />
          <InfoRow label="Auction Duration" value={formatDuration(launchInfo.auctionDuration)} />
          <InfoRow label="Pricing Steps" value={launchInfo.pricingSteps.toString()} />
          <InfoRow label="Reserve Price" value={formatUnits(launchInfo.reservePrice, 18)} />
          <InfoRow label="Lockup Duration" value={formatDuration(launchInfo.lockupDuration)} />
          <InfoRow label="Platform Fee on LP" value={formatBps(launchInfo.platformFeeOnLPFees)} />
          {launchInfo.unlockTime > BigInt(0) && (
            <InfoRow
              label="Unlock Time"
              value={new Date(Number(launchInfo.unlockTime) * 1000).toLocaleString()}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
