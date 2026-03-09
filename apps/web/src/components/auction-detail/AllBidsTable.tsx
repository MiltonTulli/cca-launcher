"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatUnits } from "viem";
import type { CCABidEntry } from "@/config/types";
import type { UseCCADataReturn } from "@/hooks/useCCAData";
import { q96Decode, q96PriceToDisplay } from "@/lib/q96";
import { shortenAddress } from "@/lib/utils";
import { BidStatusBadge } from "./BidStatusBadge";

const BIDS_PER_PAGE = 20;

interface AllBidsTableProps {
  data: UseCCADataReturn;
}

export function AllBidsTable({ data }: AllBidsTableProps) {
  const { allBids, tokenDecimals, currencyDecimals, tokenSymbol, currencySymbol, maxBidPrice } =
    data;

  const tDec = tokenDecimals ?? 18;
  const cDec = currencyDecimals ?? 18;

  // Show newest bids first
  const sortedBids = [...allBids].reverse();
  const totalPages = Math.max(1, Math.ceil(sortedBids.length / BIDS_PER_PAGE));
  const [page, setPage] = useState(0);

  const start = page * BIDS_PER_PAGE;
  const pageBids = sortedBids.slice(start, start + BIDS_PER_PAGE);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Bids</h3>
        <span className="text-xs text-muted-foreground">
          {allBids.length} bid{allBids.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {allBids.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-16">
            No bids yet
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-[8%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Bidder
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Amount
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Max Price
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Filled
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageBids.map((entry) => (
                <BidRow
                  key={entry.bidId}
                  entry={entry}
                  tokenDecimals={tDec}
                  currencyDecimals={cDec}
                  tokenSymbol={tokenSymbol}
                  currencySymbol={currencySymbol}
                  maxBidPrice={maxBidPrice}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {start + 1}–{Math.min(start + BIDS_PER_PAGE, sortedBids.length)} of {sortedBids.length}
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
  );
}

function BidRow({
  entry,
  tokenDecimals,
  currencyDecimals,
  tokenSymbol,
  currencySymbol,
  maxBidPrice,
}: {
  entry: CCABidEntry;
  tokenDecimals: number;
  currencyDecimals: number;
  tokenSymbol: string | undefined;
  currencySymbol: string | undefined;
  maxBidPrice: bigint | undefined;
}) {
  const { bidId, bid, isUserBid, status } = entry;
  const isMarketOrder =
    maxBidPrice !== undefined && bid.maxPrice >= (maxBidPrice * BigInt(9)) / BigInt(10);

  return (
    <tr className={`hover:bg-muted/50 transition-colors ${isUserBid ? "bg-primary/5" : ""}`}>
      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{bidId}</td>
      <td className="px-4 py-2.5">
        {isUserBid ? (
          <span className="text-xs font-semibold text-primary">You</span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            {shortenAddress(bid.owner)}
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">
        {formatUnits(q96Decode(bid.amountQ96), currencyDecimals)}{" "}
        <span className="text-muted-foreground">{currencySymbol ?? ""}</span>
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-xs">
        {isMarketOrder ? (
          <span className="text-primary font-medium">Market Order</span>
        ) : (
          <span className="text-foreground">
            {q96PriceToDisplay(bid.maxPrice, tokenDecimals, currencyDecimals)}{" "}
            <span className="text-muted-foreground">{currencySymbol ?? ""}</span>
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">
        {bid.tokensFilled > BigInt(0)
          ? `${formatUnits(bid.tokensFilled, tokenDecimals)} ${tokenSymbol ?? ""}`
          : "-"}
      </td>
      <td className="px-4 py-2.5 text-center">
        <BidStatusBadge status={status} />
      </td>
    </tr>
  );
}
