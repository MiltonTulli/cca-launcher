"use client";

import type { Address } from "viem";
import { useTokenMetadata } from "../../hooks/useTokenMetadata";
import type { StepProps } from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function CoreSettingsStep({ values, updateField, chainId }: StepProps) {
  const isPaymentTokenNative = !values.paymentToken || values.paymentToken === ZERO_ADDRESS;
  const paymentTokenMeta = useTokenMetadata(
    isPaymentTokenNative ? undefined : (values.paymentToken as Address),
    chainId,
  );
  const paymentTokenSymbol = isPaymentTokenNative ? "ETH" : (paymentTokenMeta.symbol ?? "ERC20");
  const paymentTokenDecimals = isPaymentTokenNative ? 18 : (paymentTokenMeta.decimals ?? 18);

  return (
    <div className="space-y-8">
      {/* Payment Token */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Payment Token</label>
        <input
          type="text"
          value={values.paymentToken}
          onChange={(e) => updateField("paymentToken", e.target.value)}
          placeholder="0x... (ERC20) or leave empty for native ETH"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium">
            {isPaymentTokenNative
              ? "ETH — 18 decimals"
              : paymentTokenMeta.isLoading
                ? "Loading..."
                : `${paymentTokenSymbol} — ${paymentTokenDecimals} decimals`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          The currency bidders will use in the auction. Leave empty for native ETH.
        </p>
      </div>

      {/* Operator */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Operator</label>
        <input
          type="text"
          value={values.operator}
          onChange={(e) => updateField("operator", e.target.value)}
          placeholder="0x..."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Address that manages the launch lifecycle (finalize, distribute, cancel). Usually the creator.
        </p>
      </div>

      {/* Treasury */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Treasury</label>
        <input
          type="text"
          value={values.treasury}
          onChange={(e) => updateField("treasury", e.target.value)}
          placeholder="0x..."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Address that receives auction proceeds and residual tokens after distribution.
        </p>
      </div>
    </div>
  );
}
