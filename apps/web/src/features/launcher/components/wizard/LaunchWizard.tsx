"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useChainId, useBlockNumber, useBlock } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import type { Address } from "viem";
import { Save, Share2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useCreateLaunch } from "../../hooks/useCreateLaunch";
import { useTokenMetadata } from "../../hooks/useTokenMetadata";
import { toLaunchParams, type LaunchFormValues } from "../../utils/toLaunchParams";
import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/components/CommentsSection";
import { ShareBar } from "@/components/ShareBar";
import { createDraft, updateDraft } from "@/lib/drafts";
import { parseTxError } from "@/lib/txError";

import { WIZARD_STEPS } from "./types";
import { validateStep } from "./validation";
import { WizardProgress } from "./WizardProgress";
import { WizardStepLayout } from "./WizardStepLayout";
import { TokenStep } from "./TokenStep";
import { CoreSettingsStep } from "./CoreSettingsStep";
import { AuctionConfigStep } from "./AuctionConfigStep";
import { LiquidityStep } from "./LiquidityStep";
import { SettlementStep } from "./SettlementStep";
import { ReviewStep } from "./ReviewStep";

const STORAGE_KEY = "launch-wizard-draft";
const DRAFT_ID_KEY = "launch-wizard-draft-id";

function getDefaultDatetime(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3600 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDefaultValues(address?: string): LaunchFormValues {
  return {
    tokenSource: "2",
    token: "",
    paymentToken: "",
    operator: address ?? "",
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
    positionBeneficiary: address ?? "",
    poolFeeTier: "3000",
    tickLower: "-887220",
    tickUpper: "887220",
    lockupEnabled: false,
    lockupDurationDays: "0",
    treasury: address ?? "",
    distributionDelayBlocks: "100",
    metadataHash: "",
    paymentTokenDecimals: "18",
  };
}

function loadDraft(): LaunchFormValues | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LaunchFormValues;
  } catch {}
  return null;
}

function saveDraft(values: LaunchFormValues) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {}
}

function clearDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(DRAFT_ID_KEY);
  } catch {}
}

export function LaunchWizard() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const chainId = useChainId();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepError, setStepError] = useState<string | null>(null);

  // Draft persistence — read both keys without side-effects in initializers
  // (React 18 Strict Mode runs initializers twice in dev, so we can't delete inside them).
  const [draftId, setDraftId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(DRAFT_ID_KEY);
    } catch {
      return null;
    }
  });
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [values, setValues] = useState<LaunchFormValues>(() => {
    try {
      const hasDraftId = sessionStorage.getItem(DRAFT_ID_KEY);
      if (hasDraftId) {
        // Coming from DraftView — load saved form values
        const draft = loadDraft();
        if (draft) return draft;
      }
    } catch {}
    // Fresh visit — use defaults
    return getDefaultValues(address);
  });

  // Clean up sessionStorage once on mount (safe from Strict Mode double-run via ref)
  const cleanedUp = useRef(false);
  useEffect(() => {
    if (cleanedUp.current) return;
    cleanedUp.current = true;
    try {
      sessionStorage.removeItem(DRAFT_ID_KEY);
      if (!draftId) sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [draftId]);

  // Update operator/treasury/beneficiary when wallet connects
  useEffect(() => {
    if (address) {
      setValues((prev) => ({
        ...prev,
        operator: prev.operator || address,
        treasury: prev.treasury || address,
        positionBeneficiary: prev.positionBeneficiary || address,
      }));
    }
  }, [address]);

  // Persist draft on value change
  useEffect(() => {
    saveDraft(values);
  }, [values]);

  const handleSaveDraft = useCallback(async () => {
    if (!address) return;
    setIsSavingDraft(true);
    try {
      const formValues = values as unknown as Record<string, string>;
      if (draftId) {
        await updateDraft(draftId, { owner: address, formValues, chainId });
        toast.success("Draft updated");
      } else {
        const draft = await createDraft({ owner: address, formValues, chainId });
        setDraftId(draft.id);
        toast.success("Draft saved");
      }
    } catch (err) {
      toast.error("Failed to save draft", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSavingDraft(false);
    }
  }, [address, values, draftId, chainId]);

  const draftShareUrl =
    typeof window !== "undefined" && draftId
      ? `${window.location.origin}/drafts/${draftId}`
      : null;

  const { data: blockNumber } = useBlockNumber({ chainId });
  const { data: block } = useBlock({ chainId });
  const { createLaunch, isPending, isConfirming, isSuccess, error: txError, launchAddress } = useCreateLaunch(chainId);

  const updateField = useCallback((field: keyof LaunchFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setStepError(null);
  }, []);

  const goToStep = useCallback((index: number) => {
    setStepError(null);
    setCurrentStep(index);
  }, []);

  const handleNext = useCallback(() => {
    const step = WIZARD_STEPS[currentStep];
    const error = validateStep(step.id, values);
    if (error) {
      setStepError(error);
      return;
    }
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setStepError(null);
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  }, [currentStep, values]);

  const handleBack = useCallback(() => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Infer payment token decimals for submission
  const isPaymentTokenNative = !values.paymentToken || values.paymentToken === "0x0000000000000000000000000000000000000000";
  const paymentTokenMeta = useTokenMetadata(
    isPaymentTokenNative ? undefined : (values.paymentToken as Address),
    chainId,
  );
  const paymentTokenDecimals = isPaymentTokenNative ? 18 : (paymentTokenMeta.decimals ?? 18);

  const handleSubmit = async () => {
    const globalError = validateStep("review", values);
    if (globalError) {
      toast.error("Validation error", { description: globalError });
      return;
    }
    if (!blockNumber || !block) {
      toast.error("Waiting for block data", { description: "Please wait a moment and try again." });
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
      clearDraft();
    } catch (err) {
      const { title, description } = parseTxError(err);
      toast.error(title, { description });
    }
  };

  // Redirect on success
  useEffect(() => {
    if (isSuccess && launchAddress) {
      toast.success("Launch created!", { description: "Redirecting to your launch page..." });
      router.push(`/launches/${launchAddress}?chain=${chainId}`);
    }
  }, [isSuccess, launchAddress, router, chainId]);

  const stepProps = { values, updateField, chainId };
  const step = WIZARD_STEPS[currentStep];
  const isReviewStep = currentStep === WIZARD_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Create Launch</h1>
        {address && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
            >
              <Save className="h-3.5 w-3.5" />
              {isSavingDraft ? "Saving..." : draftId ? "Update Draft" : "Save Draft"}
            </Button>
            {draftShareUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(draftShareUrl);
                  toast.success("Link copied!");
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-8">Set up your token launch step by step.</p>

      <WizardProgress
        currentStep={currentStep}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />
      <div className="rounded-lg border px-6 py-8 sm:px-12 sm:py-10">
        {currentStep === 0 && (
          <WizardStepLayout
            title={step.label}
            description={step.description}
            onNext={handleNext}
            isFirstStep
            error={stepError}
          >
            <TokenStep {...stepProps} />
          </WizardStepLayout>
        )}
        {currentStep === 1 && (
          <WizardStepLayout
            title={step.label}
            description={step.description}
            onBack={handleBack}
            onNext={handleNext}
            error={stepError}
          >
            <CoreSettingsStep {...stepProps} />
          </WizardStepLayout>
        )}
        {currentStep === 2 && (
          <WizardStepLayout
            title={step.label}
            description={step.description}
            onBack={handleBack}
            onNext={handleNext}
            error={stepError}
          >
            <AuctionConfigStep {...stepProps} />
          </WizardStepLayout>
        )}
        {currentStep === 3 && (
          <WizardStepLayout
            title={step.label}
            description={step.description}
            onBack={handleBack}
            onNext={handleNext}
            error={stepError}
          >
            <LiquidityStep {...stepProps} />
          </WizardStepLayout>
        )}
        {currentStep === 4 && (
          <WizardStepLayout
            title={step.label}
            description={step.description}
            onBack={handleBack}
            onNext={handleNext}
            error={stepError}
          >
            <SettlementStep {...stepProps} />
          </WizardStepLayout>
        )}
        {isReviewStep && (
          <WizardStepLayout
            title={step.label}
            description={step.description}
            onBack={handleBack}
            error={stepError}
          >
            <ReviewStep {...stepProps} onEditStep={goToStep} />
            <div className="pt-4">
              {isConnected ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isPending || isConfirming || !blockNumber}
                >
                  {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : "Create Launch"}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => open({ view: "Connect" })}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </WizardStepLayout>
        )}
      </div>

      {/* Share & Comments — visible once draft is saved */}
      {draftId && (
        <div className="mt-8 space-y-6">
          {draftShareUrl && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Share this draft</p>
                <a
                  href={`/drafts/${draftId}`}
                  className="text-xs text-muted-foreground hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open full view
                </a>
              </div>
              <ShareBar
                url={draftShareUrl}
                text="Check out this token launch draft on Tally Launch"
              />
            </div>
          )}
          <CommentsSection resourceType="draft" resourceId={draftId} />
        </div>
      )}
    </div>
  );
}
