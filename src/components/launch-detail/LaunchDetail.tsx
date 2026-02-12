"use client";

import { useState, useEffect } from "react";
import { Address } from "viem";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { XCircle, RefreshCw, ArrowRight } from "lucide-react";
import { getDraftForLaunch } from "@/lib/launch-draft";
import { CommentsSection } from "@/components/CommentsSection";
import Link from "next/link";
import { LaunchState } from "@/config/contracts";
import { ZERO_ADDRESS } from "@/lib/utils";

import { useLaunchData } from "@/hooks/useLaunchData";
import { useLaunchPreconditions } from "@/hooks/useLaunchPreconditions";
import { SwitchChainGuard } from "@/components/SwitchChainGuard";

import { LaunchHeader } from "./LaunchHeader";
import { LaunchInfoCard } from "./LaunchInfoCard";
import { AuctionInfoCard } from "./AuctionInfoCard";
import { DistributionInfoCard } from "./DistributionInfoCard";
import { ActionsPanel } from "./ActionsPanel";
import { OperatorManagement } from "./OperatorManagement";

interface LaunchDetailProps {
  address: Address;
  chainId?: number;
}

export function LaunchDetail({ address, chainId }: LaunchDetailProps) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [linkedDraftId, setLinkedDraftId] = useState<string | null>(null);

  // Tick every second for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load linked draft ID
  useEffect(() => {
    getDraftForLaunch(address).then(setLinkedDraftId).catch(() => {});
  }, [address]);

  const data = useLaunchData(address, chainId);

  const preconditionsByAction = useLaunchPreconditions({
    currentState: data.currentState,
    connectedAddress: data.connectedAddress,
    isOperator: data.isOperator,
    launchInfo: data.launchInfo,
    tokenSourceValue: data.tokenSourceValue,
    tokenAmountValue: data.tokenAmountValue,
    orchestratorTokenBalance: data.orchestratorTokenBalance,
    operatorTokenAllowance: data.operatorTokenAllowance,
    operatorTokenBalance: data.operatorTokenBalance,
    hasMinterRole: data.hasMinterRole,
    tokenLoading: data.tokenLoading,
    auctionEndTimeValue: data.auctionEndTimeValue,
    distributionDelayValue: data.distributionDelayValue,
    distributionTimestampValue: data.distributionTimestampValue,
    auctionInfo: data.auctionInfo,
    distInfo: data.distInfo,
    ccaCurrencyRaised: data.ccaCurrencyRaised,
    now,
  });

  // Loading state
  if (data.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading launch data...</p>
      </div>
    );
  }

  // Error state
  if (data.isError || !data.launchInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load launch</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm text-center">
          Could not read data from the orchestrator at this address. It may not be a valid
          orchestrator contract.
        </p>
        <Button variant="outline" onClick={data.refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const showAuctionCTA =
    data.ccaAddress &&
    data.ccaAddress !== ZERO_ADDRESS &&
    data.currentState >= LaunchState.AUCTION_ACTIVE;

  return (
    <div className="space-y-6">
      <LaunchHeader
        launchInfo={data.launchInfo}
        address={address}
        currentState={data.currentState}
        isOperator={data.isOperator}
        linkedDraftId={linkedDraftId}
        explorerUrl={data.explorerUrl}
        chainId={data.chainId}
        onRefresh={data.refetch}
      />

      {/* Prominent "View Token Auction" CTA */}
      {showAuctionCTA && (
        <Link href={`/auctions/${data.ccaAddress}?chain=${data.chainId}`} className="block">
          <div className="flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground transition-opacity hover:opacity-90">
            <div>
              <p className="text-lg font-semibold">Token Auction is Live</p>
              <p className="text-sm opacity-80">
                View the auction, place bids, and track progress
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </div>
        </Link>
      )}

      {/* 2-column grid: info left, actions right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Actions panel — order-first on mobile */}
        <div className="lg:col-span-4 lg:order-last order-first space-y-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <SwitchChainGuard requiredChainId={data.chainId}>
              <ActionsPanel
                address={address}
                currentState={data.currentState}
                connectedAddress={data.connectedAddress}
                isOperator={data.isOperator}
                isPermissionless={data.isPermissionless}
                auctionTimeElapsed={data.auctionTimeElapsed}
                preconditionsByAction={preconditionsByAction}
                onRefresh={data.refetch}
                ccaAddress={data.ccaAddress}
                ccaIsGraduated={data.ccaIsGraduated}
              />
              <OperatorManagement
                address={address}
                isOperator={data.isOperator}
                isPendingOperator={data.isPendingOperator}
                pendingOp={data.pendingOp}
                onRefresh={data.refetch}
              />
            </SwitchChainGuard>
          </div>
        </div>

        {/* Info cards */}
        <div className="lg:col-span-8 space-y-6">
          <LaunchInfoCard
            launchInfo={data.launchInfo}
            currentState={data.currentState}
            explorerUrl={data.explorerUrl}
          />
          <AuctionInfoCard
            auctionInfo={data.auctionInfo}
            currentState={data.currentState}
            explorerUrl={data.explorerUrl}
            now={now}
            ccaCurrencyRaised={data.ccaCurrencyRaised}
          />
          <DistributionInfoCard
            distInfo={data.distInfo}
            launchInfo={data.launchInfo}
            currentState={data.currentState}
            isPermissionless={data.isPermissionless}
            explorerUrl={data.explorerUrl}
            now={now}
          />
          <CommentsSection resourceType="launch" resourceId={address} />
        </div>
      </div>
    </div>
  );
}
