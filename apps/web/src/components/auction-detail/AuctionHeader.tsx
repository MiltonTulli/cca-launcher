"use client";

import { RefreshCw } from "lucide-react";
import type { Address } from "viem";
import { AddressLink } from "@/components/AddressLink";
import { Button } from "@/components/ui/button";
import { CHAIN_METADATA } from "@/config/chains";
import { CCA_PHASE_COLORS, CCA_PHASE_LABELS, CCAPhase } from "@/config/contracts";

interface AuctionHeaderProps {
  ccaAddress: Address;
  phase: CCAPhase;
  tokenSymbol: string | undefined;
  chainId: number;
  onRefresh: () => void;
}

export function AuctionHeader({
  ccaAddress,
  phase,
  tokenSymbol,
  chainId,
  onRefresh,
}: AuctionHeaderProps) {
  const initial = tokenSymbol ? tokenSymbol.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        {/* Token logo circle */}
        <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground shrink-0">
          {initial}
        </div>

        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {tokenSymbol ? `${tokenSymbol} Token Auction` : "Token Auction"}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CCA_PHASE_COLORS[phase]}`}
            >
              {phase === CCAPhase.LIVE && (
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
              {CCA_PHASE_LABELS[phase]}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {CHAIN_METADATA[chainId]?.name ?? `Chain ${chainId}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">CCA Contract:</span>
            <AddressLink address={ccaAddress} chainId={chainId} />
          </div>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onRefresh} className="shrink-0">
        <RefreshCw className="h-4 w-4 mr-1.5" />
        Refresh
      </Button>
    </div>
  );
}
