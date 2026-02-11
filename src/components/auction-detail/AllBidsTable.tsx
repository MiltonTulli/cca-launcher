"use client";

import { formatUnits } from "viem";
import { q96PriceToDisplay, q96Decode } from "@/lib/q96";
import { shortenAddress } from "@/lib/utils";
import { BidStatusBadge } from "./BidStatusBadge";
import type { UseCCADataReturn } from "@/hooks/useCCAData";
import type { CCABidEntry } from "@/config/types";

interface AllBidsTableProps {
  data: UseCCADataReturn;
}

export function AllBidsTable({ data }: AllBidsTableProps) {
  const {
    allBids,
    tokenDecimals,
    currencyDecimals,
    tokenSymbol,
    currencySymbol,
    maxBidPrice,
  } = data;

  const tDec = tokenDecimals ?? 18;
  const cDec = currencyDecimals ?? 18;

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
              {allBids.map((entry) => (
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
    maxBidPrice !== undefined &&
    bid.maxPrice >= (maxBidPrice * BigInt(9)) / BigInt(10);

  return (
    <tr className={`hover:bg-muted/50 transition-colors ${isUserBid ? "bg-primary/5" : ""}`}>
      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
        {bidId}
      </td>
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
