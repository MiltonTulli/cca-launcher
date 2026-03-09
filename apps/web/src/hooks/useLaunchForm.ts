"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { type Address, decodeEventLog, isAddress, parseUnits } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  DEFAULT_FORM_VALUES,
  LAUNCH_CONSTRAINTS,
  LAUNCH_PRESETS,
  type LaunchFormValues,
  TALLY_LAUNCH_FACTORY_ABI,
  TALLY_LAUNCH_FACTORY_ADDRESSES,
  TICK_SPACING_BY_FEE,
} from "@/config/contracts";
import { createDraft, updateDraft } from "@/lib/drafts";
import { linkLaunchToDraft } from "@/lib/launch-draft";

// ============================================
// Types
// ============================================

export interface LaunchResult {
  launchId: bigint;
  launcherAddress: Address;
  txHash: string;
  params: LaunchFormValues;
}

export interface UseLaunchFormReturn {
  formValues: LaunchFormValues;
  errors: Partial<Record<keyof LaunchFormValues, string>>;
  updateField: (field: keyof LaunchFormValues, value: string) => void;
  applyPreset: (presetId: string) => void;
  handleSubmit: () => void;
  handleSaveDraft: () => void;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  writeError: Error | null;
  isSavingDraft: boolean;
  draftError: string | null;
  launchResult: LaunchResult | null;
}

interface UseLaunchFormProps {
  initialValues?: Partial<LaunchFormValues>;
  mode?: "create" | "draft";
  draftId?: string;
  onDraftSaved?: () => void;
}

// ============================================
// Hook
// ============================================

export function useLaunchForm({
  initialValues,
  mode = "create",
  draftId,
  onDraftSaved,
}: UseLaunchFormProps = {}): UseLaunchFormReturn {
  const { address } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const [formValues, setFormValues] = useState<LaunchFormValues>({
    ...DEFAULT_FORM_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LaunchFormValues, string>>>({});
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const contractAddress = TALLY_LAUNCH_FACTORY_ADDRESSES[chainId];

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Auto-fill operator with connected address
  useEffect(() => {
    if (address && !formValues.operator) {
      setFormValues((prev) => ({ ...prev, operator: address }));
    }
  }, [address, formValues.operator]);

  // Auto-update tickSpacing when poolFeeTier changes
  useEffect(() => {
    const feeTier = parseInt(formValues.poolFeeTier, 10);
    const tickSpacing = TICK_SPACING_BY_FEE[feeTier];
    if (tickSpacing && formValues.tickSpacing !== tickSpacing.toString()) {
      setFormValues((prev) => ({ ...prev, tickSpacing: tickSpacing.toString() }));
    }
  }, [formValues.poolFeeTier, formValues.tickSpacing]);

  const updateField = useCallback((field: keyof LaunchFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = LAUNCH_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setFormValues((prev) => ({
          ...prev,
          ...preset.values,
          // Keep operator as connected address
          operator: prev.operator || address || "",
          treasury: preset.values.treasury || prev.treasury || address || "",
          positionBeneficiary:
            preset.values.positionBeneficiary || prev.positionBeneficiary || address || "",
        }));
        setErrors({});
      }
    },
    [address],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof LaunchFormValues, string>> = {};

    // Address validations
    if (!isAddress(formValues.token)) newErrors.token = "Invalid token address";
    if (!isAddress(formValues.paymentToken))
      newErrors.paymentToken = "Invalid payment token address";
    if (!isAddress(formValues.operator)) newErrors.operator = "Invalid operator address";
    if (!isAddress(formValues.treasury)) newErrors.treasury = "Invalid treasury address";
    if (!isAddress(formValues.positionBeneficiary))
      newErrors.positionBeneficiary = "Invalid beneficiary address";
    if (
      formValues.validationHook &&
      formValues.validationHook !== "0x0000000000000000000000000000000000000000" &&
      !isAddress(formValues.validationHook)
    ) {
      newErrors.validationHook = "Invalid hook address";
    }
    // Token amount
    if (!formValues.tokenAmount || parseFloat(formValues.tokenAmount) <= 0) {
      newErrors.tokenAmount = "Token amount must be greater than 0";
    }

    // Auction duration
    const auctionSeconds =
      parseInt(formValues.auctionDurationDays || "0", 10) * 86400 +
      parseInt(formValues.auctionDurationHours || "0", 10) * 3600;
    if (auctionSeconds < LAUNCH_CONSTRAINTS.MIN_AUCTION_DURATION) {
      newErrors.auctionDurationDays = "Minimum duration is 1 hour";
    }
    if (auctionSeconds > LAUNCH_CONSTRAINTS.MAX_AUCTION_DURATION) {
      newErrors.auctionDurationDays = "Maximum duration is 30 days";
    }

    // Pricing steps
    const steps = parseInt(formValues.pricingSteps || "0", 10);
    if (
      steps < LAUNCH_CONSTRAINTS.MIN_PRICING_STEPS ||
      steps > LAUNCH_CONSTRAINTS.MAX_PRICING_STEPS
    ) {
      newErrors.pricingSteps = `Must be between ${LAUNCH_CONSTRAINTS.MIN_PRICING_STEPS} and ${LAUNCH_CONSTRAINTS.MAX_PRICING_STEPS}`;
    }

    // Reserve price — must meet CCA's MIN_FLOOR_PRICE (uint32.max + 1 = 4,294,967,296 raw units)
    if (!formValues.reservePrice || parseFloat(formValues.reservePrice) <= 0) {
      newErrors.reservePrice = "Reserve price must be greater than 0";
    } else {
      const paymentDecimals = parseInt(formValues.paymentTokenDecimals || "18", 10);
      const reserveRaw = parseUnits(formValues.reservePrice, paymentDecimals);
      const MIN_FLOOR_PRICE = BigInt("4294967296"); // 2^32
      if (reserveRaw < MIN_FLOOR_PRICE) {
        const minHuman = Number(MIN_FLOOR_PRICE) / 10 ** paymentDecimals;
        newErrors.reservePrice = `Reserve price too low. Minimum: ${minHuman > 0.000001 ? minHuman.toFixed(6) : "~0"} (${MIN_FLOOR_PRICE.toString()} raw units)`;
      }
    }

    // Allocation
    const liquidityAlloc = parseInt(formValues.liquidityAllocationPercent || "0", 10);
    const treasuryAlloc = parseInt(formValues.treasuryAllocationPercent || "0", 10);
    if (liquidityAlloc + treasuryAlloc > 100) {
      newErrors.liquidityAllocationPercent = "Total allocation cannot exceed 100%";
    }

    // Lockup duration
    const lockupSeconds = parseInt(formValues.lockupDurationDays || "0", 10) * 86400;
    if (lockupSeconds > LAUNCH_CONSTRAINTS.MAX_LOCKUP_DURATION) {
      newErrors.lockupDurationDays = "Maximum lockup is 730 days (2 years)";
    }

    // Distribution delay
    const delaySeconds = parseInt(formValues.distributionDelayDays || "0", 10) * 86400;
    if (delaySeconds > LAUNCH_CONSTRAINTS.MAX_DISTRIBUTION_DELAY) {
      newErrors.distributionDelayDays = "Maximum delay is 30 days";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formValues]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      setErrors({ token: "Contract not deployed on this network" });
      return;
    }

    const tokenDecimals = parseInt(formValues.tokenDecimals, 10);
    const paymentDecimals = parseInt(formValues.paymentTokenDecimals, 10);

    const auctionDuration = BigInt(
      parseInt(formValues.auctionDurationDays || "0", 10) * 86400 +
        parseInt(formValues.auctionDurationHours || "0", 10) * 3600,
    );

    // Calculate startTime
    let startTime = BigInt(0);
    if (formValues.startTime !== "0" && formValues.startTime !== "") {
      const date = new Date(formValues.startTime);
      startTime = BigInt(Math.floor(date.getTime() / 1000));
    }

    const params = {
      tokenSource: parseInt(formValues.tokenSource, 10),
      tokenAmount: parseUnits(formValues.tokenAmount, tokenDecimals),
      auctionDuration,
      pricingSteps: BigInt(formValues.pricingSteps),
      reservePrice: parseUnits(formValues.reservePrice, paymentDecimals),
      startTime,
      liquidityAllocation: BigInt(parseInt(formValues.liquidityAllocationPercent, 10) * 100),
      treasuryAllocation: BigInt(parseInt(formValues.treasuryAllocationPercent, 10) * 100),
      treasury: formValues.treasury as Address,
      poolFeeTier: parseInt(formValues.poolFeeTier, 10),
      tickSpacing: parseInt(formValues.tickSpacing, 10),
      lockupDuration: BigInt(parseInt(formValues.lockupDurationDays || "0", 10) * 86400),
      distributionDelay: BigInt(parseInt(formValues.distributionDelayDays || "0", 10) * 86400),
      positionBeneficiary: formValues.positionBeneficiary as Address,
      validationHook: (formValues.validationHook ||
        "0x0000000000000000000000000000000000000000") as Address,
    };

    writeContract({
      address: contractAddress,
      abi: TALLY_LAUNCH_FACTORY_ABI,
      functionName: "createLaunch",
      args: [
        formValues.token as Address,
        formValues.paymentToken as Address,
        formValues.operator as Address,
        params,
      ],
    });
  }, [formValues, validateForm, contractAddress, writeContract]);

  const handleSaveDraft = useCallback(async () => {
    if (!address) return;
    setDraftError(null);
    setIsSavingDraft(true);
    try {
      const payload = {
        owner: address,
        formValues: formValues as unknown as Record<string, string>,
        chainId,
      };

      if (mode === "draft" && draftId) {
        // Update existing draft
        await Promise.all([updateDraft(draftId, payload), new Promise((r) => setTimeout(r, 600))]);
        setIsSavingDraft(false);
        onDraftSaved?.();
      } else {
        // Create new draft
        const [draft] = await Promise.all([
          createDraft(payload),
          new Promise((r) => setTimeout(r, 600)),
        ]);
        router.push(`/drafts/${draft.id}`);
      }
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to save draft");
      setIsSavingDraft(false);
    }
  }, [formValues, chainId, address, router, mode, draftId, onDraftSaved]);

  // Update launch result when transaction succeeds
  useEffect(() => {
    if (isSuccess && receipt && hash && !launchResult) {
      // Find and decode the LaunchCreated event
      let launchId = BigInt(0);
      let launcherAddress: Address = "0x0000000000000000000000000000000000000000";

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: TALLY_LAUNCH_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "LaunchCreated") {
            const args = decoded.args as {
              launchId: bigint;
              launcher: Address;
              token: Address;
              paymentToken: Address;
              operator: Address;
              tokenAmount: bigint;
              auctionDuration: bigint;
              lockupDuration: bigint;
              platformFeeOnLPFees: bigint;
            };
            launchId = args.launchId;
            launcherAddress = args.launcher;
            break;
          }
        } catch {}
      }

      setLaunchResult({
        launchId,
        launcherAddress,
        txHash: hash,
        params: formValues,
      });

      // Fire-and-forget: link this launch back to its draft
      if (
        mode === "draft" &&
        draftId &&
        launcherAddress !== "0x0000000000000000000000000000000000000000"
      ) {
        linkLaunchToDraft(launcherAddress, draftId).catch(() => {});
      }
    }
  }, [isSuccess, receipt, hash, launchResult, formValues, mode, draftId]);

  return {
    formValues,
    errors,
    updateField,
    applyPreset,
    handleSubmit,
    handleSaveDraft,
    isPending,
    isConfirming,
    isSuccess,
    writeError: writeError ?? null,
    isSavingDraft,
    draftError,
    launchResult,
  };
}
