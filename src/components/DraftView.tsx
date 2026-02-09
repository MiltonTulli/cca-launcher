"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { LaunchForm } from "@/components/LaunchForm";
import { getDraft, type Draft } from "@/lib/drafts";
import {
  LaunchFormValues,
  POOL_FEE_TIERS,
  TOKEN_SOURCE_OPTIONS,
} from "@/config/contracts";
import { useAccount } from "wagmi";
import {
  FileText,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
  Globe,
  Rocket,
  Pencil,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { ShareBar } from "@/components/ShareBar";
import { CommentsSection } from "@/components/CommentsSection";

interface DraftViewProps {
  id: string;
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

function shortenAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr || "\u2014";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function DraftView({ id }: DraftViewProps) {
  const { address } = useAccount();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  const isOwner = draft?.owner
    ? address?.toLowerCase() === draft.owner.toLowerCase()
    : false;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/draft/${id}` : "";

  const handleDraftSaved = useCallback(() => {
    setIsEditing(false);
    fetchDraft();
  }, [fetchDraft]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading draft...</p>
      </div>
    );
  }

  // Error
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

  const fv = draft.formValues as unknown as Partial<LaunchFormValues>;

  const tokenSourceLabel =
    TOKEN_SOURCE_OPTIONS.find((o) => o.value.toString() === fv.tokenSource)?.label ?? fv.tokenSource;
  const feeTierLabel =
    POOL_FEE_TIERS.find((t) => t.value.toString() === fv.poolFeeTier)?.label ?? fv.poolFeeTier;

  const auctionDuration = (() => {
    const d = parseInt(fv.auctionDurationDays || "0");
    const h = parseInt(fv.auctionDurationHours || "0");
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    return parts.length > 0 ? parts.join(" ") : "\u2014";
  })();

  // ============================================
  // Edit mode -> show full LaunchForm
  // ============================================
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-4 w-4" />
            Back to summary
          </Button>
        </div>
        <LaunchForm
          initialValues={fv}
          mode="draft"
          draftId={id}
          onDraftSaved={handleDraftSaved}
        />
      </div>
    );
  }

  // ============================================
  // Summary mode (default)
  // ============================================
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Draft Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl">Launch Draft</CardTitle>
              <CardDescription className="font-mono text-xs mt-1 truncate">
                {id}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isOwner && address && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  <Eye className="h-3 w-3" />
                  View Only
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                Draft
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            {draft.createdAt && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {new Date(draft.createdAt).toLocaleString()}
              </div>
            )}
            {draft.owner && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">{shortenAddr(draft.owner)}</span>
              </div>
            )}
            {draft.chainId && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                Chain {draft.chainId}
              </div>
            )}
            {draft.updatedAt && draft.updatedAt !== draft.createdAt && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Updated {new Date(draft.updatedAt).toLocaleString()}
              </div>
            )}
          </div>

          <div className="mt-4">
            <ShareBar url={shareUrl} text="Check out this token launch draft on Tally Launch" />
          </div>
        </CardContent>
      </Card>

      {/* Parameters Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Token Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <SummaryRow label="Token" value={fv.token} mono />
            <SummaryRow label="Payment Token" value={fv.paymentToken} mono />
            <SummaryRow label="Token Amount" value={fv.tokenAmount} />
            <SummaryRow label="Token Source" value={tokenSourceLabel} />
            <SummaryRow label="Token Decimals" value={fv.tokenDecimals} />
            <SummaryRow label="Payment Decimals" value={fv.paymentTokenDecimals} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Operators &amp; Beneficiaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <SummaryRow label="Operator" value={fv.operator} mono />
            <SummaryRow label="Treasury" value={fv.treasury} mono />
            <SummaryRow label="Position Beneficiary" value={fv.positionBeneficiary} mono />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Auction Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <SummaryRow label="Duration" value={auctionDuration} />
            <SummaryRow label="Pricing Steps" value={fv.pricingSteps} />
            <SummaryRow label="Reserve Price" value={fv.reservePrice} />
            <SummaryRow
              label="Start Time"
              value={fv.startTime === "0" ? "Immediate" : fv.startTime}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Allocation &amp; Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <SummaryRow label="Liquidity" value={fv.liquidityAllocationPercent ? `${fv.liquidityAllocationPercent}%` : undefined} />
            <SummaryRow label="Treasury" value={fv.treasuryAllocationPercent ? `${fv.treasuryAllocationPercent}%` : undefined} />
            <SummaryRow label="Pool Fee Tier" value={feeTierLabel} />
            <SummaryRow label="Tick Spacing" value={fv.tickSpacing} />
            <SummaryRow label="Lockup Duration" value={fv.lockupDurationDays ? `${fv.lockupDurationDays} days` : undefined} />
            <SummaryRow label="Distribution Delay" value={fv.distributionDelayDays ? `${fv.distributionDelayDays} days` : undefined} />
            {fv.validationHook && fv.validationHook !== ZERO_ADDR && (
              <SummaryRow label="Validation Hook" value={fv.validationHook} mono />
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isOwner && (
          <Button
            variant="outline"
            className="flex-1 h-12 text-base"
            size="lg"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-5 w-5" />
            Edit
          </Button>
        )}
        {!address ? (
          <div className="flex-1 flex flex-col items-center gap-2">
            <appkit-button balance="hide" />
            <p className="text-xs text-muted-foreground">Connect to launch</p>
          </div>
        ) : (
          <Button
            className="flex-1 h-12 text-base"
            size="lg"
            onClick={() => setIsEditing(true)}
          >
            <Rocket className="h-5 w-5" />
            Launch
          </Button>
        )}
      </div>

      {/* Comments */}
      <CommentsSection resourceType="draft" resourceId={id} />
    </div>
  );
}

// ============================================
// Summary Row
// ============================================
function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  const display = value || "\u2014";
  const shortened = mono && display.length > 20 ? shortenAddr(display) : display;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""} title={mono ? value : undefined}>
        {shortened}
      </span>
    </div>
  );
}
