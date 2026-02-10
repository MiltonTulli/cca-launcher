"use client";

import { formatUnits } from "viem";
import { InfoRow } from "@/components/InfoRow";
import { q96PriceToDisplay } from "@/lib/q96";
import { ZERO_ADDRESS } from "@/lib/utils";
import type { UseCCADataReturn } from "@/hooks/useCCAData";

interface SaleInfoCardProps {
  data: UseCCADataReturn;
}

export function SaleInfoCard({ data }: SaleInfoCardProps) {
  const {
    tokenAddress,
    currencyAddress,
    totalSupply,
    floorPrice,
    tickSpacing,
    startBlock,
    endBlock,
    claimBlock,
    fundsRecipient,
    tokensRecipient,
    validationHook,
    tokenDecimals,
    currencyDecimals,
    tokenSymbol,
    currencySymbol,
    explorerUrl,
  } = data;

  const tDec = tokenDecimals ?? 18;
  const cDec = currencyDecimals ?? 18;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Auction Parameters</h3>
      </div>
      <div className="p-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoRow
            label="Token"
            value={tokenAddress ?? ""}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Currency"
            value={currencyAddress ?? ""}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Total Supply"
            value={
              totalSupply !== undefined && tokenDecimals !== undefined
                ? `${formatUnits(totalSupply, tokenDecimals)} ${tokenSymbol ?? ""}`
                : "..."
            }
          />
          <InfoRow
            label="Floor Price"
            value={
              floorPrice !== undefined
                ? `${q96PriceToDisplay(floorPrice, tDec, cDec)} ${currencySymbol ?? ""}`
                : "..."
            }
          />
          <InfoRow
            label="Max Bid Price"
            value="Unlimited"
          />
          <InfoRow
            label="Tick Spacing"
            value={tickSpacing?.toString() ?? "..."}
          />
          <InfoRow
            label="Start Block"
            value={startBlock?.toString() ?? "..."}
          />
          <InfoRow
            label="End Block"
            value={endBlock?.toString() ?? "..."}
          />
          <InfoRow
            label="Claim Block"
            value={claimBlock?.toString() ?? "..."}
          />
          <InfoRow
            label="Funds Recipient"
            value={fundsRecipient ?? ""}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Tokens Recipient"
            value={tokensRecipient ?? ""}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Validation Hook"
            value={
              validationHook && validationHook !== ZERO_ADDRESS
                ? validationHook
                : "None"
            }
            isAddress={!!validationHook && validationHook !== ZERO_ADDRESS}
            explorerUrl={explorerUrl}
          />
        </div>
      </div>
    </div>
  );
}
