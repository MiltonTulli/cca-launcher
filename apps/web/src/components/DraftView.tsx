"use client";

import {
  AlertCircle,
  Clock,
  Eye,
  Globe,
  Pencil,
  RefreshCw,
  Rocket,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useBlockNumber, useBlock } from "wagmi";
import { useRouter } from "next/navigation";
import type { Address } from "viem";
import { toast } from "sonner";
import { CommentsSection } from "@/components/CommentsSection";
import { ShareBar } from "@/components/ShareBar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { WalletButton } from "@/components/WalletButton";
import { type Draft, getDraft } from "@/lib/drafts";
import { shortenAddress } from "@/lib/utils";
import { parseTxError } from "@/lib/txError";
import { TokenSource, POOL_FEE_TIERS } from "@launcher/sdk";
import { TOKEN_SOURCE_OPTIONS } from "@/features/launcher/utils/displayState";
import { toLaunchParams, type LaunchFormValues } from "@/features/launcher/utils/toLaunchParams";
import { useCreateLaunch } from "@/features/launcher/hooks/useCreateLaunch";
import { useTokenMetadata } from "@/features/launcher/hooks/useTokenMetadata";

interface DraftViewProps {
  id: string;
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-semibold">{children}</h4>;
}

export function DraftView({ id }: DraftViewProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: blockNumber } = useBlockNumber({ chainId });
  const { data: block } = useBlock({ chainId });
  const { createLaunch, isPending, isConfirming, isSuccess, launchAddress } = useCreateLaunch(chainId);

  const fetchDraft = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDraft(id);
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load draft");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const isOwner = draft?.owner ? address?.toLowerCase() === draft.owner.toLowerCase() : false;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/drafts/${id}` : "";

  const fv = (draft?.formValues ?? {}) as unknown as Partial<LaunchFormValues>;

  const isPaymentTokenNative =
    !fv.paymentToken || fv.paymentToken === "0x0000000000000000000000000000000000000000";
  const paymentTokenMeta = useTokenMetadata(
    isPaymentTokenNative ? undefined : (fv.paymentToken as Address),
    chainId,
  );
  const paymentTokenDecimals = isPaymentTokenNative ? 18 : (paymentTokenMeta.decimals ?? 18);
  const paymentTokenSymbol = isPaymentTokenNative ? "ETH" : (paymentTokenMeta.symbol ?? "ERC20");

  const handleEdit = useCallback(() => {
    try {
      sessionStorage.setItem("launch-wizard-draft", JSON.stringify(draft?.formValues));
      sessionStorage.setItem("launch-wizard-draft-id", id);
    } catch {}
    router.push("/launches/create");
  }, [draft, id, router]);

  const handleLaunch = useCallback(async () => {
    if (!draft || !blockNumber || !block) return;
    try {
      const values: LaunchFormValues = {
        ...(draft.formValues as unknown as LaunchFormValues),
        tokenDecimals: "18",
        paymentTokenDecimals: String(paymentTokenDecimals),
      };
      const params = toLaunchParams(values, {
        currentBlock: blockNumber,
        currentTimestamp: Number(block.timestamp),
        chainId,
      });
      await createLaunch(params);
    } catch (err) {
      const { title, description } = parseTxError(err);
      toast.error(title, { description });
    }
  }, [draft, blockNumber, block, paymentTokenDecimals, chainId, createLaunch]);

  useEffect(() => {
    if (isSuccess && launchAddress) {
      toast.success("Launch created!", { description: "Redirecting to your launch page..." });
      router.push(`/launches/${launchAddress}?chain=${chainId}`);
    }
  }, [isSuccess, launchAddress, router, chainId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading draft...</p>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Draft not found</h2>
        <p className="text-sm text-muted-foreground mb-1 max-w-sm text-center">
          {error || "Could not load draft."}
        </p>
        <p className="text-xs text-muted-foreground font-mono mb-4">{id}</p>
        <Button variant="outline" onClick={fetchDraft}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const tokenSourceLabel =
    TOKEN_SOURCE_OPTIONS.find((o) => String(o.value) === fv.tokenSource)?.label ?? fv.tokenSource;
  const isCreateNew = fv.tokenSource === String(TokenSource.CREATE_NEW);
  const feeTierLabel =
    POOL_FEE_TIERS.find((t) => String(t.value) === fv.poolFeeTier)?.label ?? fv.poolFeeTier;
  const isLaunching = isPending || isConfirming;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Launch Draft</h1>
        <div className="flex items-center gap-2">
          {!isOwner && address && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Eye className="h-3 w-3" />
              View Only
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
            Draft
          </span>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-6">
        <span className="font-mono">{id}</span>
        {draft.owner && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {shortenAddress(draft.owner)}
          </span>
        )}
        {draft.chainId && (
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Chain {draft.chainId}
          </span>
        )}
        {draft.createdAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(draft.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Configuration — compact review-style layout */}
      <div className="rounded-lg border px-6 py-8 sm:px-8 space-y-6">
        {/* Token */}
        <div className="rounded-lg border p-4 space-y-1">
          <SectionTitle>Token Setup</SectionTitle>
          <Row label="Source" value={tokenSourceLabel} />
          {!isCreateNew && <Row label="Token" value={fv.token ? shortenAddress(fv.token) : undefined} />}
          <Row label="Total Amount" value={fv.totalTokenAmount} />
        </div>

        {/* Core */}
        <div className="rounded-lg border p-4 space-y-1">
          <SectionTitle>Core Settings</SectionTitle>
          <Row
            label="Payment Token"
            value={isPaymentTokenNative ? "Native ETH" : `${paymentTokenSymbol} (${shortenAddress(fv.paymentToken)})`}
          />
          <Row label="Operator" value={fv.operator ? shortenAddress(fv.operator) : undefined} />
          <Row label="Treasury" value={fv.treasury ? shortenAddress(fv.treasury) : undefined} />
        </div>

        {/* Auction */}
        <div className="rounded-lg border p-4 space-y-1">
          <SectionTitle>Auction Rules</SectionTitle>
          <Row label="Start" value={fv.auctionStart ? new Date(fv.auctionStart).toLocaleString() : undefined} />
          <Row label="End" value={fv.auctionEnd ? new Date(fv.auctionEnd).toLocaleString() : undefined} />
          <Row label="Claim Delay" value={fv.claimDelay ? `${fv.claimDelay} min` : undefined} />
          <Row
            label="Floor Price"
            value={fv.reservePrice ? `${fv.reservePrice} ${paymentTokenSymbol}` : undefined}
          />
          <Row
            label="Required Raised"
            value={
              fv.requiredCurrencyRaised === "0"
                ? "No threshold"
                : fv.requiredCurrencyRaised
                  ? `${fv.requiredCurrencyRaised} ${paymentTokenSymbol}`
                  : undefined
            }
          />
        </div>

        {/* Liquidity */}
        <div className="rounded-lg border p-4 space-y-1">
          <SectionTitle>Liquidity Setup</SectionTitle>
          {fv.liquidityEnabled ? (
            <>
              <Row label="Enabled" value="Yes" />
              <Row label="Token to LP" value={fv.liquidityPercent ? `${fv.liquidityPercent}%` : undefined} />
              <Row
                label="Proceeds to LP"
                value={fv.proceedsToLiquidityPercent ? `${fv.proceedsToLiquidityPercent}%` : undefined}
              />
              <Row label="Pool Fee" value={feeTierLabel} />
              <Row label="Lockup" value={fv.lockupEnabled ? `${fv.lockupDurationDays} days` : "None"} />
            </>
          ) : (
            <Row label="Enabled" value="No" />
          )}
        </div>

        {/* Settlement */}
        <div className="rounded-lg border p-4 space-y-1">
          <SectionTitle>Settlement</SectionTitle>
          <Row
            label="Distribution Delay"
            value={fv.distributionDelayBlocks ? `${fv.distributionDelayBlocks} blocks` : undefined}
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-3">
          {isOwner && (
            <Button variant="outline" className="flex-1" onClick={handleEdit} disabled={isLaunching}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
          {!address ? (
            <div className="flex-1 flex flex-col items-center gap-2">
              <WalletButton />
              <p className="text-xs text-muted-foreground">Connect to launch</p>
            </div>
          ) : (
            <Button className="flex-1" onClick={handleLaunch} disabled={isLaunching || !blockNumber}>
              {isPending ? (
                <>
                  <Spinner size="sm" />
                  Confirm in wallet...
                </>
              ) : isConfirming ? (
                <>
                  <Spinner size="sm" />
                  Confirming...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Launch
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Share + Comments */}
      <div className="mt-6 space-y-6">
        <div className="flex items-center justify-between">
          <ShareBar url={shareUrl} text="Check out this token launch draft on Tally Launch" />
        </div>
        <CommentsSection resourceType="draft" resourceId={id} />
      </div>
    </div>
  );
}
