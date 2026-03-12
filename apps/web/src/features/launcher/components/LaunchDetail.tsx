"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, RefreshCw, Shield, XCircle } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { useLaunch } from "../hooks/useLaunch";
import { useLaunchState } from "../hooks/useLaunchState";
import { useLaunchPreconditions } from "../hooks/useLaunchPreconditions";
import { useTokenMetadata } from "../hooks/useTokenMetadata";
import { LAUNCH_STATE_LABELS } from "../utils/displayState";
import { LaunchStateBadge, LiquidityStateBadge } from "./StateBadge";
import { ActionsPanel } from "./ActionsPanel";
import { LaunchInfoCard } from "./LaunchInfoCard";
import { AuctionInfoCard } from "./AuctionInfoCard";
import { LiquidityInfoCard } from "./LiquidityInfoCard";
import { OperatorManagement } from "./OperatorManagement";
import { AddressLink } from "@/components/AddressLink";
import { ShareBar } from "@/components/ShareBar";
import { SwitchChainGuard } from "@/components/SwitchChainGuard";
import { Button } from "@/components/ui/button";
import { CHAIN_METADATA } from "@/config/chains";
import { LaunchState, LiquidityState } from "@launcher/sdk";
import type { Address } from "viem";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface LaunchDetailProps {
  launchAddress: Address;
  chainId?: number;
}

export function LaunchDetail({ launchAddress, chainId }: LaunchDetailProps) {
  const { address: userAddress } = useAccount();
  const connectedChainId = useChainId();
  const resolvedChainId = chainId ?? connectedChainId;
  const { data: launchData, isLoading, error, refetch } = useLaunch(launchAddress, resolvedChainId);
  const { effectiveState, blockNumber, blocksUntilAuctionStart, blocksUntilAuctionEnd, liquidityState } = useLaunchState(launchData, resolvedChainId);
  const preconditions = useLaunchPreconditions(launchData, launchAddress, resolvedChainId);
  const tokenMeta = useTokenMetadata(launchData?.token as Address | undefined, resolvedChainId);
  const paymentTokenMeta = useTokenMetadata(launchData?.paymentToken as Address | undefined, resolvedChainId);

  const isOperator = !!userAddress && !!launchData && userAddress.toLowerCase() === launchData.operator.toLowerCase();
  const explorerUrl = CHAIN_METADATA[resolvedChainId]?.explorerUrl ?? "https://etherscan.io";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading launch data...</p>
      </div>
    );
  }

  if (error || !launchData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load launch</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm text-center">
          Could not read data from the orchestrator at this address. It may not be a valid orchestrator contract.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const hasCCA = launchData.cca && launchData.cca !== ZERO_ADDRESS;
  const isAuctionLive = effectiveState === "AUCTION_ACTIVE";
  const showAuctionLink = hasCCA && launchData.state >= LaunchState.FINALIZED;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Launch #{launchData.launchId.toString()}</h1>
            {effectiveState !== undefined && <LaunchStateBadge state={effectiveState} />}
            {liquidityState !== undefined && liquidityState !== LiquidityState.NONE && (
              <LiquidityStateBadge state={liquidityState} />
            )}
            <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {CHAIN_METADATA[resolvedChainId]?.name ?? `Chain ${resolvedChainId}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{launchAddress}</span>
            <a
              href={`${explorerUrl}/address/${launchAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {isOperator && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5">
              <Shield className="h-3 w-3" />
              You are the operator
            </span>
          )}
          <div className="mt-2">
            <ShareBar
              url={typeof window !== "undefined" ? `${window.location.origin}/launches/${launchAddress}?chain=${resolvedChainId}` : ""}
              text={`Check out Launch #${launchData.launchId.toString()} on Tally Launch`}
            />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Auction CTA banner */}
      {showAuctionLink && (
        <Link href={`/auctions/${launchData.cca}?chain=${resolvedChainId}`} className="block">
          <div
            className={`flex items-center justify-between rounded-lg px-5 py-4 transition-opacity hover:opacity-90 ${
              isAuctionLive
                ? "bg-primary text-primary-foreground"
                : "bg-muted border border-border text-foreground"
            }`}
          >
            <div>
              <p className="text-lg font-semibold">
                {isAuctionLive
                  ? "Token Auction is Live"
                  : `Token Auction — ${effectiveState ? LAUNCH_STATE_LABELS[effectiveState] : "Ended"}`}
              </p>
              <p className={`text-sm ${isAuctionLive ? "opacity-80" : "text-muted-foreground"}`}>
                {isAuctionLive
                  ? "View the auction, place bids, and track progress"
                  : "View auction results and claim tokens"}
              </p>
            </div>
            <ArrowRight className={`h-5 w-5 shrink-0 ${isAuctionLive ? "" : "text-muted-foreground"}`} />
          </div>
        </Link>
      )}

      {/* 2-column grid: info left (8), actions right (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Actions panel — order-first on mobile */}
        <div className="lg:col-span-4 lg:order-last order-first space-y-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <SwitchChainGuard requiredChainId={resolvedChainId}>
              {effectiveState !== undefined && (
                <ActionsPanel
                  launchData={launchData}
                  launchAddress={launchAddress}
                  effectiveState={effectiveState}
                  preconditions={preconditions}
                  chainId={resolvedChainId}
                  blocksUntilAuctionStart={blocksUntilAuctionStart}
                  blocksUntilAuctionEnd={blocksUntilAuctionEnd}
                  onActionSuccess={() => refetch()}
                />
              )}
              <OperatorManagement
                launchData={launchData}
                launchAddress={launchAddress}
                chainId={resolvedChainId}
              />
            </SwitchChainGuard>
          </div>
        </div>

        {/* Info cards */}
        <div className="lg:col-span-8 space-y-6">
          <LaunchInfoCard
            launchData={launchData}
            chainId={resolvedChainId}
            tokenSymbol={tokenMeta.symbol}
            tokenDecimals={tokenMeta.decimals}
            paymentTokenSymbol={paymentTokenMeta.symbol}
          />
          <AuctionInfoCard
            launchData={launchData}
            effectiveState={effectiveState!}
            blockNumber={blockNumber}
            chainId={resolvedChainId}
          />
          {launchData.liquidityInfo && launchData.liquidityInfo.state !== LiquidityState.NONE && (
            <LiquidityInfoCard launchData={launchData} chainId={resolvedChainId} />
          )}
        </div>
      </div>
    </div>
  );
}
