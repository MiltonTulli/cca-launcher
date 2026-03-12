"use client";

import { useState, useMemo } from "react";
import { useAccount, useChainId, useBlockNumber, useBlock } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { isAddress } from "viem";
import type { Address } from "viem";
import { TokenSource, POOL_FEE_TIERS } from "@launcher/sdk";
import { useCreateLaunch } from "../hooks/useCreateLaunch";
import { useTokenMetadata } from "../hooks/useTokenMetadata";
import { toLaunchParams, type LaunchFormValues } from "../utils/toLaunchParams";
import { TOKEN_SOURCE_OPTIONS } from "../utils/displayState";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Info, Wallet } from "lucide-react";

function getDefaultDatetime(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3600 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const defaultValues: LaunchFormValues = {
  tokenSource: "2", // CREATE_NEW
  token: "",
  paymentToken: "",
  operator: "",
  tokenName: "",
  tokenSymbol: "",
  tokenDecimals: "18",
  tokenInitialSupply: "0",
  auctionStart: getDefaultDatetime(1),
  auctionEnd: getDefaultDatetime(25),
  claimDelay: "60",
  reservePrice: "0",
  auctionTickSpacing: "2",
  requiredCurrencyRaised: "0",
  totalTokenAmount: "",
  liquidityPercent: "30",
  liquidityEnabled: false,
  proceedsToLiquidityPercent: "50",
  positionBeneficiary: "",
  poolFeeTier: "3000",
  tickLower: "-887220",
  tickUpper: "887220",
  lockupEnabled: false,
  lockupDurationDays: "0",
  treasury: "",
  distributionDelayBlocks: "100",
  metadataHash: "",
  paymentTokenDecimals: "18",
};

export function CreateLaunchForm() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const chainId = useChainId();
  const router = useRouter();
  const [values, setValues] = useState<LaunchFormValues>({
    ...defaultValues,
    operator: address ?? "",
    positionBeneficiary: address ?? "",
    treasury: address ?? "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: blockNumber } = useBlockNumber({ chainId });
  const { data: block } = useBlock({ chainId });

  const { createLaunch, isPending, isConfirming, isSuccess, error, launchAddress } = useCreateLaunch(chainId);

  const isCreateNew = values.tokenSource === String(TokenSource.CREATE_NEW);

  // Infer payment token metadata
  const isPaymentTokenNative = !values.paymentToken || values.paymentToken === ZERO_ADDRESS;
  const paymentTokenMeta = useTokenMetadata(
    isPaymentTokenNative ? undefined : (values.paymentToken as Address),
    chainId,
  );
  const paymentTokenSymbol = isPaymentTokenNative ? "ETH" : (paymentTokenMeta.symbol ?? "ERC20");
  const paymentTokenDecimals = isPaymentTokenNative ? 18 : (paymentTokenMeta.decimals ?? 18);

  // Infer token metadata (for EXISTING_* sources)
  const hasTokenAddress = !isCreateNew && values.token && isAddress(values.token) && values.token !== ZERO_ADDRESS;
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

  const updateField = (field: keyof LaunchFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!blockNumber || !block) {
      setFormError("Waiting for block data...");
      return;
    }

    if (values.paymentToken && values.paymentToken !== ZERO_ADDRESS && !isAddress(values.paymentToken)) {
      setFormError("Payment token must be a valid address (leave empty for native ETH)");
      return;
    }
    if (!isAddress(values.operator)) {
      setFormError("Operator address is required");
      return;
    }
    if (!isAddress(values.treasury)) {
      setFormError("Treasury address is required");
      return;
    }
    if (!values.totalTokenAmount || Number(values.totalTokenAmount) <= 0) {
      setFormError("Total token amount must be greater than 0");
      return;
    }
    if (!values.reservePrice || Number(values.reservePrice) <= 0) {
      setFormError("Floor price must be greater than 0");
      return;
    }
    if (values.auctionEnd <= values.auctionStart) {
      setFormError("Auction end must be after auction start");
      return;
    }

    try {
      const submissionValues: LaunchFormValues = {
        ...values,
        tokenDecimals: "18",
        paymentTokenDecimals: String(paymentTokenDecimals),
      };
      const params = toLaunchParams(submissionValues, {
        currentBlock: blockNumber,
        currentTimestamp: Number(block.timestamp),
        chainId,
      });
      await createLaunch(params);
    } catch (err: any) {
      setFormError(err?.shortMessage || err?.message || "Failed to create launch");
    }
  };

  if (isSuccess && launchAddress) {
    router.push(`/launches/${launchAddress}?chain=${chainId}`);
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-green-600">Launch created! Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create Launch</h1>

      {/* Token Source + Token Allocation (unified) */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="text-sm font-medium px-1">Token</legend>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Token Source</label>
          <select
            value={values.tokenSource}
            onChange={(e) => updateField("tokenSource", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {TOKEN_SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {!isCreateNew && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Token Address</label>
            <div className="relative">
              <input type="text" value={values.token} onChange={(e) => updateField("token", e.target.value)}
                placeholder="0x..." className="w-full rounded-md border px-3 py-2 text-sm pr-32" />
              {tokenMeta.symbol && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {tokenMeta.symbol} ({tokenMeta.decimals ?? 18} dec)
                </span>
              )}
            </div>
          </div>
        )}

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

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Total Token Amount</label>
          <input type="text" value={values.totalTokenAmount} onChange={(e) => updateField("totalTokenAmount", e.target.value)}
            placeholder="e.g. 1000000" className="w-full rounded-md border px-3 py-2 text-sm" />
          <p className="text-xs text-muted-foreground">Total tokens to allocate between auction and liquidity (18 decimals).</p>
        </div>

        {values.liquidityEnabled && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">% to Liquidity Pool</label>
            <input type="range" min="0" max="80" step="1"
              value={values.liquidityPercent}
              onChange={(e) => updateField("liquidityPercent", e.target.value)}
              className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{values.liquidityPercent}% to LP</span>
              <span>{100 - Number(values.liquidityPercent)}% to Auction</span>
            </div>
          </div>
        )}
        {allocationPreview && (
          <div className="grid grid-cols-2 gap-2 rounded bg-muted/30 p-2 text-xs">
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
      </fieldset>

      {/* Core Addresses */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="text-sm font-medium px-1">Core Settings</legend>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Payment Token</label>
          <div className="relative">
            <input type="text" value={values.paymentToken} onChange={(e) => updateField("paymentToken", e.target.value)}
              placeholder="0x... (ERC20) or leave empty for native ETH" className="w-full rounded-md border px-3 py-2 text-sm pr-32" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {isPaymentTokenNative ? "ETH (18 dec)" : paymentTokenMeta.isLoading ? "loading..." : `${paymentTokenSymbol} (${paymentTokenDecimals} dec)`}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Operator</label>
          <input type="text" value={values.operator} onChange={(e) => updateField("operator", e.target.value)}
            placeholder="0x..." className="w-full rounded-md border px-3 py-2 text-sm" />
          <p className="text-xs text-muted-foreground">Address that manages the launch lifecycle (finalize, distribute, cancel). Usually the creator.</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Treasury</label>
          <input type="text" value={values.treasury} onChange={(e) => updateField("treasury", e.target.value)}
            placeholder="0x..." className="w-full rounded-md border px-3 py-2 text-sm" />
          <p className="text-xs text-muted-foreground">Address that receives auction proceeds and residual tokens after distribution.</p>
        </div>
      </fieldset>

      {/* Auction Config */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="text-sm font-medium px-1">Auction Config</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Auction Start</label>
            <input type="datetime-local" value={values.auctionStart}
              onChange={(e) => updateField("auctionStart", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Auction End</label>
            <input type="datetime-local" value={values.auctionEnd}
              onChange={(e) => updateField("auctionEnd", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Claim Delay (minutes after end)</label>
            <input type="number" value={values.claimDelay}
              onChange={(e) => updateField("claimDelay", e.target.value)}
              min="0" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Floor Price ({paymentTokenSymbol})</label>
            <input type="text" value={values.reservePrice} onChange={(e) => updateField("reservePrice", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm" />
            <p className="text-xs text-muted-foreground">
              Minimum price per token. Bids below this price are rejected.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Required Currency Raised ({paymentTokenSymbol})</label>
          <input type="text" value={values.requiredCurrencyRaised} onChange={(e) => updateField("requiredCurrencyRaised", e.target.value)}
            placeholder="0"
            className="w-full rounded-md border px-3 py-2 text-sm" />
          <p className="text-xs text-muted-foreground">
            Minimum {paymentTokenSymbol} that must be raised for the auction to graduate. 0 = no threshold (e.g. 0.5 = 0.5 {paymentTokenSymbol}).
          </p>
        </div>
        {blockNumber && (
          <p className="text-xs text-muted-foreground">
            Current block: {blockNumber.toString()} — blocks will be estimated from dates at submission time
          </p>
        )}
      </fieldset>

      {/* Liquidity Config */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="text-sm font-medium px-1">Liquidity Config</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={values.liquidityEnabled} onChange={(e) => updateField("liquidityEnabled", e.target.checked)} />
          Enable Liquidity Bootstrap
        </label>
        {values.liquidityEnabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Proceeds to Liquidity (%)</label>
                <input type="number" value={values.proceedsToLiquidityPercent} onChange={(e) => updateField("proceedsToLiquidityPercent", e.target.value)}
                  min="0" max="100" className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Pool Fee Tier</label>
                <select value={values.poolFeeTier} onChange={(e) => updateField("poolFeeTier", e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm">
                  {POOL_FEE_TIERS.map((tier) => (
                    <option key={tier.value} value={tier.value}>{tier.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Tick Lower</label>
                <input type="number" value={values.tickLower} onChange={(e) => updateField("tickLower", e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Tick Upper</label>
                <input type="number" value={values.tickUpper} onChange={(e) => updateField("tickUpper", e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Position Beneficiary</label>
              <input type="text" value={values.positionBeneficiary} onChange={(e) => updateField("positionBeneficiary", e.target.value)}
                placeholder="0x..." className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={values.lockupEnabled} onChange={(e) => updateField("lockupEnabled", e.target.checked)} />
              Enable Lockup
            </label>
            {values.lockupEnabled && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Lockup Duration (days)</label>
                <input type="number" value={values.lockupDurationDays} onChange={(e) => updateField("lockupDurationDays", e.target.value)}
                  min="0" className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* Settlement */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="text-sm font-medium px-1">Settlement</legend>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Distribution Delay (blocks)</label>
          <input type="number" value={values.distributionDelayBlocks} onChange={(e) => updateField("distributionDelayBlocks", e.target.value)}
            min="0" className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
      </fieldset>

      {/* Submit */}
      {formError && <p className="text-sm text-red-500">{formError}</p>}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
      {isConnected ? (
        <Button type="submit" disabled={isPending || isConfirming || !blockNumber} className="w-full">
          {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : "Create Launch"}
        </Button>
      ) : (
        <Button type="button" onClick={() => open({ view: "Connect" })} className="w-full">
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      )}
    </form>
  );
}
