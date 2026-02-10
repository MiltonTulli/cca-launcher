"use client";

import { formatUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoRow } from "@/components/InfoRow";
import { Clock } from "lucide-react";
import { LaunchState } from "@/config/contracts";
import { formatCountdown, ZERO_ADDRESS } from "@/lib/utils";
import Link from "next/link";
import type { AuctionInfo } from "./types";

interface AuctionInfoCardProps {
  auctionInfo: AuctionInfo | undefined;
  currentState: LaunchState;
  explorerUrl: string;
  now: number;
}

export function AuctionInfoCard({
  auctionInfo,
  currentState,
  explorerUrl,
  now,
}: AuctionInfoCardProps) {
  if (currentState < LaunchState.AUCTION_ACTIVE || !auctionInfo) return null;

  const endTime = Number(auctionInfo.endTime);
  const timeRemaining = endTime > now ? endTime - now : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Auction Status
          {auctionInfo.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              <Clock className="h-3 w-3" />
              Live
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {auctionInfo.isActive && (
            <div className="sm:col-span-2 rounded-lg bg-primary/5 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
              <p className="text-2xl font-bold font-mono">
                {formatCountdown(timeRemaining)}
              </p>
            </div>
          )}
          <InfoRow
            label="CCA Contract"
            value={auctionInfo.cca}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Start Time"
            value={
              Number(auctionInfo.startTime) > 0
                ? new Date(Number(auctionInfo.startTime) * 1000).toLocaleString()
                : "Not started"
            }
          />
          <InfoRow
            label="End Time"
            value={
              Number(auctionInfo.endTime) > 0
                ? new Date(Number(auctionInfo.endTime) * 1000).toLocaleString()
                : "N/A"
            }
          />
          <InfoRow
            label="Current Price"
            value={formatUnits(auctionInfo.currentPrice, 18)}
          />
          <InfoRow
            label="Reserve Price"
            value={formatUnits(auctionInfo.reservePrice, 18)}
          />
          <InfoRow label="Tokens Sold" value={formatUnits(auctionInfo.tokensSold, 18)} />
          <InfoRow label="Total Raised" value={formatUnits(auctionInfo.totalRaised, 18)} />
          <InfoRow label="Has Ended" value={auctionInfo.hasEnded ? "Yes" : "No"} />
          {auctionInfo.cca && auctionInfo.cca !== ZERO_ADDRESS && (
            <div className="sm:col-span-2 pt-2">
              <Link href={`/sales/${auctionInfo.cca}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Token Sale
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
