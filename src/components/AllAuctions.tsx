"use client";

import { useRouter } from "next/navigation";
import { formatUnits } from "viem";
import { useChainId } from "wagmi";
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
import { ShoppingCart, RefreshCw, ExternalLink } from "lucide-react";
import { useAuctions } from "@/hooks/useAuctions";
import { shortenAddress, getExplorerUrl } from "@/lib/utils";
import type { AuctionEntry } from "@/config/types";

function StatusBadge({ auction }: { auction: AuctionEntry }) {
  const label = auction.isActive
    ? "Live"
    : auction.hasEnded
      ? "Ended"
      : "Coming Soon";

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
  const { auctions, isLoading, refetch } = useAuctions();
  const router = useRouter();
  const chainId = useChainId();

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
          <h1 className="text-2xl font-bold">All Auctions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {auctions.length} auction{auctions.length !== 1 ? "s" : ""} on this network
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...auctions].reverse().map((auction) => (
              <TableRow
                key={auction.ccaAddress}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/auctions/${auction.ccaAddress}`)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{auction.launchId.toString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {auction.tokenSymbol && (
                      <span className="text-xs font-medium text-foreground">
                        {auction.tokenSymbol}
                      </span>
                    )}
                    <a
                      href={getExplorerUrl(chainId, "address", auction.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {shortenAddress(auction.token)}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={getExplorerUrl(chainId, "address", auction.ccaAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {shortenAddress(auction.ccaAddress)}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatUnits(auction.totalRaised, auction.currencyDecimals ?? 18)}
                  {auction.currencySymbol && (
                    <span className="text-muted-foreground ml-1">{auction.currencySymbol}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatUnits(auction.currentPrice, auction.currencyDecimals ?? 18)}
                  {auction.currencySymbol && (
                    <span className="text-muted-foreground ml-1">{auction.currencySymbol}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge auction={auction} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
