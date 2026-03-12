"use client";

import { TokenSource } from "@launcher/sdk";
import type { Address } from "viem";
import { useTokenMetadata } from "../../hooks/useTokenMetadata";
import { TOKEN_SOURCE_OPTIONS } from "../../utils/displayState";
import { POOL_FEE_TIERS } from "@launcher/sdk";
import { shortenAddress } from "@/lib/utils";
import { Pencil } from "lucide-react";
import type { StepProps } from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface ReviewStepProps extends StepProps {
  onEditStep: (step: number) => void;
}

function SectionHeader({ title, stepIndex, onEdit }: { title: string; stepIndex: number; onEdit: (i: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold">{title}</h4>
      <button
        type="button"
        onClick={() => onEdit(stepIndex)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right max-w-[60%] truncate ${warn ? "text-amber-600" : ""}`}>{value}</span>
    </div>
  );
}

export function ReviewStep({ values, chainId, onEditStep }: ReviewStepProps) {
  const isCreateNew = values.tokenSource === String(TokenSource.CREATE_NEW);
  const isPaymentTokenNative = !values.paymentToken || values.paymentToken === ZERO_ADDRESS;

  const paymentTokenMeta = useTokenMetadata(
    isPaymentTokenNative ? undefined : (values.paymentToken as Address),
    chainId,
  );
  const paymentTokenSymbol = isPaymentTokenNative ? "ETH" : (paymentTokenMeta.symbol ?? "ERC20");

  const tokenSourceLabel = TOKEN_SOURCE_OPTIONS.find((o) => String(o.value) === values.tokenSource)?.label ?? "Unknown";
  const poolFeeLabel = POOL_FEE_TIERS.find((t) => String(t.value) === values.poolFeeTier)?.label ?? values.poolFeeTier;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review your launch configuration. Click Edit to jump back to any step.
      </p>

      {/* Token */}
      <div className="rounded-lg border p-4 space-y-1">
        <SectionHeader title="Token Setup" stepIndex={0} onEdit={onEditStep} />
        <Row label="Source" value={tokenSourceLabel} />
        {!isCreateNew && <Row label="Token" value={values.token ? shortenAddress(values.token) : "Not set"} warn={!values.token} />}
        <Row label="Total Amount" value={values.totalTokenAmount || "0"} warn={!values.totalTokenAmount} />
      </div>

      {/* Core */}
      <div className="rounded-lg border p-4 space-y-1">
        <SectionHeader title="Core Settings" stepIndex={1} onEdit={onEditStep} />
        <Row label="Payment Token" value={isPaymentTokenNative ? "Native ETH" : `${paymentTokenSymbol} (${shortenAddress(values.paymentToken)})`} />
        <Row label="Operator" value={shortenAddress(values.operator)} />
        <Row label="Treasury" value={shortenAddress(values.treasury)} />
      </div>

      {/* Auction */}
      <div className="rounded-lg border p-4 space-y-1">
        <SectionHeader title="Auction Rules" stepIndex={2} onEdit={onEditStep} />
        <Row label="Start" value={new Date(values.auctionStart).toLocaleString()} />
        <Row label="End" value={new Date(values.auctionEnd).toLocaleString()} />
        <Row label="Claim Delay" value={`${values.claimDelay} min`} />
        <Row label="Floor Price" value={`${values.reservePrice} ${paymentTokenSymbol}`} warn={!values.reservePrice || values.reservePrice === "0"} />
        <Row label="Required Raised" value={values.requiredCurrencyRaised === "0" ? "No threshold" : `${values.requiredCurrencyRaised} ${paymentTokenSymbol}`} />
      </div>

      {/* Liquidity */}
      <div className="rounded-lg border p-4 space-y-1">
        <SectionHeader title="Liquidity Setup" stepIndex={3} onEdit={onEditStep} />
        {values.liquidityEnabled ? (
          <>
            <Row label="Enabled" value="Yes" />
            <Row label="Token to LP" value={`${values.liquidityPercent}%`} />
            <Row label="Proceeds to LP" value={`${values.proceedsToLiquidityPercent}%`} />
            <Row label="Pool Fee" value={poolFeeLabel} />
            <Row label="Lockup" value={values.lockupEnabled ? `${values.lockupDurationDays} days` : "None"} />
          </>
        ) : (
          <Row label="Enabled" value="No" />
        )}
      </div>

      {/* Settlement */}
      <div className="rounded-lg border p-4 space-y-1">
        <SectionHeader title="Settlement" stepIndex={4} onEdit={onEditStep} />
        <Row label="Distribution Delay" value={`${values.distributionDelayBlocks} blocks`} />
      </div>

      {/* Reminder for CREATE_NEW */}
      {isCreateNew && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-medium">Reminder: Token creation is a separate step</p>
          <p className="mt-1 text-blue-700 text-xs">
            After submitting, you will need to call <code className="rounded bg-blue-100 px-1 font-mono text-xs">createToken()</code> and
            then <code className="rounded bg-blue-100 px-1 font-mono text-xs">finalizeSetup()</code> from the launch detail page.
          </p>
        </div>
      )}
    </div>
  );
}
