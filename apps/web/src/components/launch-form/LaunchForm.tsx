"use client";

import { AlertCircle, ChevronDown, Clock, Rocket, Save, Settings2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { WalletButton } from "@/components/WalletButton";
import {
  LAUNCH_PRESETS,
  type LaunchFormValues,
  POOL_FEE_TIERS,
  TOKEN_SOURCE_OPTIONS,
} from "@/config/contracts";
import { useLaunchForm } from "@/hooks/useLaunchForm";
import { FormField } from "./FormField";
import { LaunchSuccessView } from "./LaunchSuccessView";

interface LaunchFormProps {
  /** Pre-fill the form with these values (e.g. from a draft) */
  initialValues?: Partial<LaunchFormValues>;
  /** "create" = normal mode, "draft" = launched from a draft page */
  mode?: "create" | "draft";
  /** When editing an existing draft, the server-side draft ID */
  draftId?: string;
  /** Called after a draft is saved/updated (e.g. to refresh parent view) */
  onDraftSaved?: () => void;
}

export function LaunchForm({
  initialValues,
  mode = "create",
  draftId,
  onDraftSaved,
}: LaunchFormProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    formValues,
    errors,
    updateField,
    applyPreset,
    handleSubmit,
    handleSaveDraft,
    isPending,
    isConfirming,
    isSuccess,
    writeError,
    isSavingDraft,
    draftError,
    launchResult,
  } = useLaunchForm({ initialValues, mode, draftId, onDraftSaved });

  // Show success view
  if (isSuccess && launchResult) {
    return <LaunchSuccessView result={launchResult} chainId={chainId} />;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Rocket className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create Token Launch</CardTitle>
        <CardDescription>
          Configure and deploy your token launch using TallyLaunchFactory
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Presets (hidden in draft mode) */}
        {mode !== "draft" && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label>Quick Start Presets</Label>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {LAUNCH_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className="flex flex-col items-start rounded-lg border p-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <span className="text-sm font-medium">{preset.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Token Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Token Configuration
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Token Address"
              value={formValues.token}
              onChange={(v) => updateField("token", v)}
              placeholder="0x..."
              error={errors.token}
            />
            <FormField
              label="Token Decimals"
              value={formValues.tokenDecimals}
              onChange={(v) => updateField("tokenDecimals", v)}
              type="number"
              hint="Usually 18"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Payment Token"
              value={formValues.paymentToken}
              onChange={(v) => updateField("paymentToken", v)}
              placeholder="0x... (WETH, USDC, etc.)"
              error={errors.paymentToken}
            />
            <FormField
              label="Payment Decimals"
              value={formValues.paymentTokenDecimals}
              onChange={(v) => updateField("paymentTokenDecimals", v)}
              type="number"
              hint="6 for USDC, 18 for WETH"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Token Amount"
              value={formValues.tokenAmount}
              onChange={(v) => updateField("tokenAmount", v)}
              placeholder="1000000"
              type="number"
              error={errors.tokenAmount}
              hint="Amount to launch"
            />
            <div className="space-y-2">
              <Label>Token Source</Label>
              <Select
                value={formValues.tokenSource}
                onValueChange={(v) => updateField("tokenSource", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label} - {opt.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Operator & Beneficiaries */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Operators & Beneficiaries
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Operator"
              value={formValues.operator}
              onChange={(v) => updateField("operator", v)}
              placeholder="0x..."
              error={errors.operator}
              hint="Controls the launch"
            />
            <FormField
              label="Treasury"
              value={formValues.treasury}
              onChange={(v) => updateField("treasury", v)}
              placeholder="0x..."
              error={errors.treasury}
              hint="Receives treasury allocation"
            />
          </div>
          <FormField
            label="Position Beneficiary"
            value={formValues.positionBeneficiary}
            onChange={(v) => updateField("positionBeneficiary", v)}
            placeholder="0x... (LP position recipient)"
            error={errors.positionBeneficiary}
          />
        </div>

        <Separator />

        {/* Auction Parameters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Auction Parameters
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="Duration (Days)"
              value={formValues.auctionDurationDays}
              onChange={(v) => updateField("auctionDurationDays", v)}
              type="number"
              error={errors.auctionDurationDays}
            />
            <FormField
              label="Duration (Hours)"
              value={formValues.auctionDurationHours}
              onChange={(v) => updateField("auctionDurationHours", v)}
              type="number"
            />
            <FormField
              label="Pricing Steps"
              value={formValues.pricingSteps}
              onChange={(v) => updateField("pricingSteps", v)}
              type="number"
              error={errors.pricingSteps}
              hint="1-1000"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Reserve Price"
              value={formValues.reservePrice}
              onChange={(v) => updateField("reservePrice", v)}
              placeholder="0.001"
              type="number"
              error={errors.reservePrice}
              hint="Min price per token"
            />
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Start Time
                <span className="text-xs text-muted-foreground">(0 = immediate)</span>
              </Label>
              <Input
                type={formValues.startTime === "0" ? "text" : "datetime-local"}
                value={formValues.startTime === "0" ? "0 (Immediate)" : formValues.startTime}
                onChange={(e) =>
                  updateField(
                    "startTime",
                    e.target.value === "0 (Immediate)" ? "0" : e.target.value,
                  )
                }
                onFocus={(e) => {
                  if (formValues.startTime === "0") {
                    updateField("startTime", "");
                    e.target.type = "datetime-local";
                  }
                }}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Allocation */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Allocation Split
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Liquidity Allocation (%)"
              value={formValues.liquidityAllocationPercent}
              onChange={(v) => updateField("liquidityAllocationPercent", v)}
              type="number"
              error={errors.liquidityAllocationPercent}
              hint="Goes to LP"
            />
            <FormField
              label="Treasury Allocation (%)"
              value={formValues.treasuryAllocationPercent}
              onChange={(v) => updateField("treasuryAllocationPercent", v)}
              type="number"
              hint="Goes to treasury"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total:{" "}
            {parseInt(formValues.liquidityAllocationPercent || "0", 10) +
              parseInt(formValues.treasuryAllocationPercent || "0", 10)}
            %
            {parseInt(formValues.liquidityAllocationPercent || "0", 10) +
              parseInt(formValues.treasuryAllocationPercent || "0", 10) >
              100 && <span className="text-destructive ml-2">(Cannot exceed 100%)</span>}
          </div>
        </div>

        <Separator />

        {/* Pool & Lockup */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pool & Lockup Settings
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pool Fee Tier</Label>
              <Select
                value={formValues.poolFeeTier}
                onValueChange={(v) => updateField("poolFeeTier", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fee tier" />
                </SelectTrigger>
                <SelectContent>
                  {POOL_FEE_TIERS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value.toString()}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tick spacing: {formValues.tickSpacing}
              </p>
            </div>
            <FormField
              label="Lockup Duration (Days)"
              value={formValues.lockupDurationDays}
              onChange={(v) => updateField("lockupDurationDays", v)}
              type="number"
              error={errors.lockupDurationDays}
              hint="Max 730 days"
            />
          </div>
          <FormField
            label="Distribution Delay (Days)"
            value={formValues.distributionDelayDays}
            onChange={(v) => updateField("distributionDelayDays", v)}
            type="number"
            error={errors.distributionDelayDays}
            hint="Max 30 days"
          />
        </div>

        {/* Advanced Settings Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          Advanced Settings
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <FormField
              label="Validation Hook"
              value={formValues.validationHook}
              onChange={(v) => updateField("validationHook", v)}
              placeholder="0x0000...0000 (none)"
              error={errors.validationHook}
              hint="Permitter contract for validation rules"
            />
            <FormField
              label="Tick Spacing"
              value={formValues.tickSpacing}
              onChange={(v) => updateField("tickSpacing", v)}
              type="number"
              hint="Auto-set based on fee tier"
            />
          </div>
        )}

        {/* Error Display */}
        {writeError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              {writeError.message.includes("User rejected")
                ? "Transaction was rejected"
                : writeError.message.slice(0, 200)}
            </div>
          </div>
        )}

        {draftError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">{draftError}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!address ? (
            <>
              <WalletButton size="lg" />
              <p className="text-xs text-center text-muted-foreground">
                Connect your wallet to create a launch{mode !== "draft" ? " or save a draft" : ""}
              </p>
            </>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isPending || isConfirming}
                variant="outline"
                className="h-12 text-base"
                size="lg"
              >
                {isSavingDraft ? (
                  <>
                    <Spinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {mode === "draft" ? "Save Changes" : "Save Draft"}
                  </>
                )}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || isConfirming || isSavingDraft}
                className="flex-1 h-12 text-base"
                size="lg"
              >
                {isPending || isConfirming ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    {isPending ? "Confirm in Wallet..." : "Confirming..."}
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Create Launch
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
