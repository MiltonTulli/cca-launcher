"use client";

import { useBlockNumber } from "wagmi";
import type { Address } from "viem";
import { useTokenMetadata } from "../../hooks/useTokenMetadata";
import type { StepProps } from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function AuctionConfigStep({ values, updateField, chainId }: StepProps) {
  const { data: blockNumber } = useBlockNumber({ chainId });

  const isPaymentTokenNative = !values.paymentToken || values.paymentToken === ZERO_ADDRESS;
  const paymentTokenMeta = useTokenMetadata(
    isPaymentTokenNative ? undefined : (values.paymentToken as Address),
    chainId,
  );
  const paymentTokenSymbol = isPaymentTokenNative ? "ETH" : (paymentTokenMeta.symbol ?? "ERC20");

  return (
    <div className="space-y-8">
      {/* Timing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Auction Start</label>
          <input
            type="datetime-local"
            value={values.auctionStart}
            onChange={(e) => updateField("auctionStart", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Auction End</label>
          <input
            type="datetime-local"
            value={values.auctionEnd}
            onChange={(e) => updateField("auctionEnd", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Claim Delay + Floor Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Claim Delay (minutes after end)</label>
          <input
            type="number"
            value={values.claimDelay}
            onChange={(e) => updateField("claimDelay", e.target.value)}
            min="0"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Time after auction ends before claims are available.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Floor Price ({paymentTokenSymbol})</label>
          <input
            type="text"
            value={values.reservePrice}
            onChange={(e) => updateField("reservePrice", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Minimum price per token. Bids below this price are rejected.
          </p>
        </div>
      </div>

      {/* Required Currency Raised */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Required Currency Raised ({paymentTokenSymbol})</label>
        <input
          type="text"
          value={values.requiredCurrencyRaised}
          onChange={(e) => updateField("requiredCurrencyRaised", e.target.value)}
          placeholder="0"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Minimum {paymentTokenSymbol} that must be raised for the auction to graduate.
          0 = no threshold (e.g. 0.5 = 0.5 {paymentTokenSymbol}).
        </p>
      </div>

      {blockNumber && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
          Current block: {blockNumber.toString()} — blocks will be estimated from dates at submission time.
        </p>
      )}
    </div>
  );
}
