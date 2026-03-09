"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUnits } from "viem";
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
import { LAUNCH_STATE_COLORS, LAUNCH_STATE_LABELS } from "@/config/contracts";
import { useLaunches } from "@/hooks/useLaunches";
import { getExplorerUrl, shortenAddress } from "@/lib/utils";

const ROWS_PER_PAGE = 20;

export function AllLaunches() {
  const { launches, isLoading, refetch, chainId } = useLaunches();
  const router = useRouter();
  const [page, setPage] = useState(0);

  const sorted = [...launches].reverse();
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const start = page * ROWS_PER_PAGE;
  const pageRows = sorted.slice(start, start + ROWS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading launches...</p>
      </div>
    );
  }

  if (launches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Globe className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">No launches yet</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center">
          No token launches have been created on this network yet. Be the first!
        </p>
        <Link href="/launches/new" className="mt-6">
          <Button>
            <Plus className="h-4 w-4" />
            Create Launch
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">All Launches</h1>
            <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {CHAIN_METADATA[chainId]?.name ?? `Chain ${chainId}`}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {launches.length} launch{launches.length !== 1 ? "es" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* CTA Banner */}
      <Link href="/launches/new" className="block">
        <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/30 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Create a new token launch</p>
              <p className="text-xs text-muted-foreground">
                Deploy your token with a fair auction and automated liquidity
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </Link>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead className="text-right">Token Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Network</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((launch) => (
              <TableRow
                key={launch.orchestratorAddress}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  router.push(`/launches/${launch.orchestratorAddress}?chain=${chainId}`)
                }
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{launch.launchId.toString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col">
                      {launch.tokenSymbol && (
                        <span className="text-xs font-medium text-foreground">
                          {launch.tokenSymbol}
                        </span>
                      )}
                      {launch.tokenName && (
                        <span className="text-[10px] text-muted-foreground leading-tight">
                          {launch.tokenName}
                        </span>
                      )}
                    </div>
                    <a
                      href={getExplorerUrl(chainId, "address", launch.token)}
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
                    href={getExplorerUrl(chainId, "address", launch.operator)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {shortenAddress(launch.operator)}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatUnits(launch.tokenAmount, launch.tokenDecimals ?? 18)}
                  {launch.tokenSymbol && (
                    <span className="text-muted-foreground ml-1">{launch.tokenSymbol}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      LAUNCH_STATE_COLORS[launch.state]
                    }`}
                  >
                    {LAUNCH_STATE_LABELS[launch.state]}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center rounded-full bg-muted border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {CHAIN_METADATA[chainId]?.shortName ?? chainId}
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
