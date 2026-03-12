"use client";

import { useMemo } from "react";
import { isAddress } from "viem";
import { TokenSource } from "@launcher/sdk";
import type { Address } from "viem";
import { useTokenMetadata } from "../../hooks/useTokenMetadata";
import { Info } from "lucide-react";
import type { StepProps } from "./types";

const TOKEN_SOURCES = [
  {
    value: String(TokenSource.CREATE_NEW),
    label: "Create New Token",
    description: "A new ERC20 token will be deployed after launch creation via createToken().",
  },
  {
    value: String(TokenSource.EXISTING_BALANCE),
    label: "Existing Balance",
    description: "Use tokens already held by the operator wallet.",
  },
  {
    value: String(TokenSource.EXISTING_TRANSFER_FROM),
    label: "Transfer From (approve)",
    description: "Tokens will be pulled from an approved address via transferFrom.",
  },
];

export function TokenStep({ values, updateField, chainId }: StepProps) {
  const isCreateNew = values.tokenSource === String(TokenSource.CREATE_NEW);

  const hasTokenAddress = !isCreateNew && values.token && isAddress(values.token) && values.token !== "0x0000000000000000000000000000000000000000";
  const tokenMeta = useTokenMetadata(
    hasTokenAddress ? (values.token as Address) : undefined,
    chainId,
  );

  const allocationPreview = useMemo(() => {
    if (!values.totalTokenAmount) return null;
    const total = Number(values.totalTokenAmount);
    if (total <= 0) return null;
    const lpPct = values.liquidityEnabled ? Number(values.liquidityPercent || 0) : 0;
    const lpAmount = (total * lpPct) / 100;
    const auctionAmount = total - lpAmount;
    return { auctionAmount: auctionAmount.toFixed(2), lpAmount: lpAmount.toFixed(2) };
  }, [values.totalTokenAmount, values.liquidityPercent, values.liquidityEnabled]);

  return (
    <div className="space-y-8">
      {/* Token Source Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Token Source</label>
        <div className="grid gap-4">
          {TOKEN_SOURCES.map((source) => (
            <label
              key={source.value}
              className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors
                ${values.tokenSource === source.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            >
              <input
                type="radio"
                name="tokenSource"
                value={source.value}
                checked={values.tokenSource === source.value}
                onChange={(e) => updateField("tokenSource", e.target.value)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium">{source.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{source.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Token Address for existing sources */}
      {!isCreateNew && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Token Address</label>
          <div className="relative">
            <input
              type="text"
              value={values.token}
              onChange={(e) => updateField("token", e.target.value)}
              placeholder="0x..."
              className="w-full rounded-md border px-3 py-2 text-sm pr-32"
            />
            {tokenMeta.symbol && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {tokenMeta.symbol} ({tokenMeta.decimals ?? 18} dec)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Create New info banner */}
      {isCreateNew && (
        <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Token will be created after launch deployment</p>
            <p className="mt-1 text-blue-700">
              After creating the launch, call <code className="rounded bg-blue-100 px-1 font-mono text-xs">createToken()</code> on
              the orchestrator from the launch detail page before finalizing setup. Token decimals: 18.
            </p>
          </div>
        </div>
      )}

      {/* Total Token Amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Total Token Amount</label>
        <input
          type="text"
          value={values.totalTokenAmount}
          onChange={(e) => updateField("totalTokenAmount", e.target.value)}
          placeholder="e.g. 1000000"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Total tokens to allocate between auction and liquidity (18 decimals).
        </p>
      </div>

      {/* Allocation preview */}
      {allocationPreview && (
        <div className="grid grid-cols-2 gap-2 rounded bg-muted/30 p-3 text-sm">
          <div>
            <span className="text-muted-foreground">Auction: </span>
            <span className="font-medium">{allocationPreview.auctionAmount}</span>
          </div>
          {values.liquidityEnabled && (
            <div>
              <span className="text-muted-foreground">Liquidity: </span>
              <span className="font-medium">{allocationPreview.lpAmount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
