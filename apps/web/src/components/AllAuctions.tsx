"use client";

import { ChevronLeft, ChevronRight, ExternalLink, RefreshCw, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUnits } from "viem";
import { SubmitAuctionForm } from "@/components/SubmitAuctionForm";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHAIN_METADATA } from "@/config/chains";
import type { AuctionEntry } from "@/config/types";
import { useAuctions } from "@/hooks/useAuctions";
import { useCommunityAuctions } from "@/hooks/useCommunityAuctions";
import { useStandaloneAuctions } from "@/hooks/useStandaloneAuctions";
import { getExplorerUrl, shortenAddress } from "@/lib/utils";

const ROWS_PER_PAGE = 20;

/** Format a bigint amount with up to `maxDecimals` fractional digits; prefix with ~ if truncated. */
function formatAmount(value: bigint, decimals: number, maxDecimals = 4): string {
  const raw = formatUnits(value, decimals);
  const [int, dec] = raw.split(".");
  if (!dec || dec.length <= maxDecimals) return raw;
  const truncated = dec.slice(0, maxDecimals).replace(/0+$/, "");
  return `~${int}${truncated ? `.${truncated}` : ""}`;
}

/** Native currency symbol per chain. */
const NATIVE_SYMBOL: Record<number, string> = {
  1: "ETH",
  11155111: "ETH",
  8453: "ETH",
  84532: "ETH",
};

function StatusBadge({ auction }: { auction: AuctionEntry }) {
  const label = auction.isActive ? "Live" : auction.hasEnded ? "Ended" : "Coming Soon";

  const color = auction.isActive
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
    : auction.hasEnded
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}

export function AllAuctions() {
  const { auctions: factoryAuctions, isLoading: isLoadingFactory, refetch } = useAuctions();
  const {
    addresses: communityAddresses,
    isLoading: isLoadingCommunity,
    refetch: refetchCommunity,
  } = useCommunityAuctions();
  const { auctions: standaloneAuctions, isLoading: isLoadingStandalone } =
    useStandaloneAuctions(communityAddresses);
  const router = useRouter();
  const [page, setPage] = useState(0);

  const isLoading = isLoadingFactory || isLoadingStandalone || isLoadingCommunity;
  const auctions = [...factoryAuctions, ...standaloneAuctions];
  const sorted = [...auctions].reverse();
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const start = page * ROWS_PER_PAGE;
  const pageRows = sorted.slice(start, start + ROWS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading auctions...</p>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">No active auctions</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center">
          No CCA token auctions have been started on this network yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">All Auctions</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {auctions.length} auction{auctions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <SubmitAuctionForm onSuccess={refetchCommunity} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Total Raised</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Network</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((auction) => (
              <TableRow
                key={auction.ccaAddress}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  router.push(`/auctions/${auction.ccaAddress}?chain=${auction.chainId}`)
                }
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {auction.launchId === BigInt(0) ? "—" : `#${auction.launchId.toString()}`}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col">
                      {auction.tokenSymbol && (
                        <span className="text-xs font-medium text-foreground">
                          {auction.tokenSymbol}
                        </span>
                      )}
                      {auction.tokenName && (
                        <span className="text-[10px] text-muted-foreground leading-tight">
                          {auction.tokenName}
                        </span>
                      )}
                    </div>
                    <a
                      href={getExplorerUrl(auction.chainId, "address", auction.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-muted-foreground hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={getExplorerUrl(auction.chainId, "address", auction.ccaAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {shortenAddress(auction.ccaAddress)}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatAmount(auction.totalRaised, auction.currencyDecimals ?? 18)}
                  <span className="text-muted-foreground ml-1">
                    {auction.currencySymbol ?? NATIVE_SYMBOL[auction.chainId] ?? "ETH"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatAmount(auction.currentPrice, auction.currencyDecimals ?? 18)}
                  <span className="text-muted-foreground ml-1">
                    {auction.currencySymbol ?? NATIVE_SYMBOL[auction.chainId] ?? "ETH"}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge auction={auction} />
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center rounded-full bg-muted border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {CHAIN_METADATA[auction.chainId]?.shortName ?? auction.chainId}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {start + 1}–{Math.min(start + ROWS_PER_PAGE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
