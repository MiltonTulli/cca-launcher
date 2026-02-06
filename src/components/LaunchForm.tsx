"use client";

import { useState, useCallback, useEffect } from "react";
import { parseUnits, isAddress, Address, decodeEventLog } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  TALLY_LAUNCH_FACTORY_ABI,
  TALLY_LAUNCH_FACTORY_ADDRESSES,
  POOL_FEE_TIERS,
  LAUNCH_CONSTRAINTS,
  TOKEN_SOURCE_OPTIONS,
  TICK_SPACING_BY_FEE,
  LAUNCH_PRESETS,
  LaunchFormValues,
  DEFAULT_FORM_VALUES,
  TokenSource,
} from "@/config/contracts";
import {
  Rocket,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ChevronDown,
  Info,
  Clock,
  Settings2,
} from "lucide-react";

interface LaunchResult {
  launchId: bigint;
  launcherAddress: Address;
  txHash: string;
  params: LaunchFormValues;
}

export function LaunchForm() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [formValues, setFormValues] = useState<LaunchFormValues>(DEFAULT_FORM_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof LaunchFormValues, string>>>({});
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const contractAddress = TALLY_LAUNCH_FACTORY_ADDRESSES[chainId];

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
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
    const feeTier = parseInt(formValues.poolFeeTier);
    const tickSpacing = TICK_SPACING_BY_FEE[feeTier];
    if (tickSpacing && formValues.tickSpacing !== tickSpacing.toString()) {
      setFormValues((prev) => ({ ...prev, tickSpacing: tickSpacing.toString() }));
    }
  }, [formValues.poolFeeTier, formValues.tickSpacing]);

  const updateField = useCallback((field: keyof LaunchFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = LAUNCH_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setFormValues((prev) => ({
        ...prev,
        ...preset.values,
        // Keep operator as connected address
        operator: prev.operator || address || "",
        treasury: preset.values.treasury || prev.treasury || address || "",
        positionBeneficiary: preset.values.positionBeneficiary || prev.positionBeneficiary || address || "",
      }));
      setErrors({});
    }
  }, [address]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof LaunchFormValues, string>> = {};

    // Address validations
    if (!isAddress(formValues.token)) newErrors.token = "Invalid token address";
    if (!isAddress(formValues.paymentToken)) newErrors.paymentToken = "Invalid payment token address";
    if (!isAddress(formValues.operator)) newErrors.operator = "Invalid operator address";
    if (!isAddress(formValues.treasury)) newErrors.treasury = "Invalid treasury address";
    if (!isAddress(formValues.positionBeneficiary)) newErrors.positionBeneficiary = "Invalid beneficiary address";
    if (formValues.validationHook && formValues.validationHook !== "0x0000000000000000000000000000000000000000" && !isAddress(formValues.validationHook)) {
      newErrors.validationHook = "Invalid hook address";
    }

    // Token amount
    if (!formValues.tokenAmount || parseFloat(formValues.tokenAmount) <= 0) {
      newErrors.tokenAmount = "Token amount must be greater than 0";
    }

    // Auction duration
    const auctionSeconds =
      parseInt(formValues.auctionDurationDays || "0") * 86400 +
      parseInt(formValues.auctionDurationHours || "0") * 3600;
    if (auctionSeconds < LAUNCH_CONSTRAINTS.MIN_AUCTION_DURATION) {
      newErrors.auctionDurationDays = "Minimum duration is 1 hour";
    }
    if (auctionSeconds > LAUNCH_CONSTRAINTS.MAX_AUCTION_DURATION) {
      newErrors.auctionDurationDays = "Maximum duration is 30 days";
    }

    // Pricing steps
    const steps = parseInt(formValues.pricingSteps || "0");
    if (steps < LAUNCH_CONSTRAINTS.MIN_PRICING_STEPS || steps > LAUNCH_CONSTRAINTS.MAX_PRICING_STEPS) {
      newErrors.pricingSteps = `Must be between ${LAUNCH_CONSTRAINTS.MIN_PRICING_STEPS} and ${LAUNCH_CONSTRAINTS.MAX_PRICING_STEPS}`;
    }

    // Reserve price
    if (!formValues.reservePrice || parseFloat(formValues.reservePrice) <= 0) {
      newErrors.reservePrice = "Reserve price must be greater than 0";
    }

    // Allocation
    const liquidityAlloc = parseInt(formValues.liquidityAllocationPercent || "0");
    const treasuryAlloc = parseInt(formValues.treasuryAllocationPercent || "0");
    if (liquidityAlloc + treasuryAlloc > 100) {
      newErrors.liquidityAllocationPercent = "Total allocation cannot exceed 100%";
    }

    // Lockup duration
    const lockupSeconds = parseInt(formValues.lockupDurationDays || "0") * 86400;
    if (lockupSeconds > LAUNCH_CONSTRAINTS.MAX_LOCKUP_DURATION) {
      newErrors.lockupDurationDays = "Maximum lockup is 730 days (2 years)";
    }

    // Distribution delay
    const delaySeconds = parseInt(formValues.distributionDelayDays || "0") * 86400;
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

    const tokenDecimals = parseInt(formValues.tokenDecimals);
    const paymentDecimals = parseInt(formValues.paymentTokenDecimals);

    const auctionDuration =
      BigInt(parseInt(formValues.auctionDurationDays || "0") * 86400 +
        parseInt(formValues.auctionDurationHours || "0") * 3600);

    // Calculate startTime
    let startTime = BigInt(0);
    if (formValues.startTime !== "0" && formValues.startTime !== "") {
      const date = new Date(formValues.startTime);
      startTime = BigInt(Math.floor(date.getTime() / 1000));
    }

    const params = {
      tokenSource: parseInt(formValues.tokenSource),
      tokenAmount: parseUnits(formValues.tokenAmount, tokenDecimals),
      auctionDuration,
      pricingSteps: BigInt(formValues.pricingSteps),
      reservePrice: parseUnits(formValues.reservePrice, paymentDecimals),
      startTime,
      liquidityAllocation: BigInt(parseInt(formValues.liquidityAllocationPercent) * 100),
      treasuryAllocation: BigInt(parseInt(formValues.treasuryAllocationPercent) * 100),
      treasury: formValues.treasury as Address,
      poolFeeTier: parseInt(formValues.poolFeeTier),
      tickSpacing: parseInt(formValues.tickSpacing),
      lockupDuration: BigInt(parseInt(formValues.lockupDurationDays || "0") * 86400),
      distributionDelay: BigInt(parseInt(formValues.distributionDelayDays || "0") * 86400),
      positionBeneficiary: formValues.positionBeneficiary as Address,
      validationHook: (formValues.validationHook || "0x0000000000000000000000000000000000000000") as Address,
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
              launcherAddress: Address;
              token: Address;
              paymentToken: Address;
              operator: Address;
              tokenAmount: bigint;
              auctionDuration: bigint;
              lockupDuration: bigint;
              platformFeeOnLPFees: bigint;
            };
            launchId = args.launchId;
            launcherAddress = args.launcherAddress;
            break;
          }
        } catch {
          // Not the event we're looking for, continue
          continue;
        }
      }

      setLaunchResult({
        launchId,
        launcherAddress,
        txHash: hash,
        params: formValues,
      });
    }
  }, [isSuccess, receipt, hash, launchResult, formValues]);

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
            {/* Presets */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label>Quick Start Presets</Label>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {LAUNCH_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className="flex flex-col items-start rounded-lg border p-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <span className="text-sm font-medium">{preset.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

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
                    onChange={(e) => updateField("startTime", e.target.value === "0 (Immediate)" ? "0" : e.target.value)}
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
                Total: {parseInt(formValues.liquidityAllocationPercent || "0") +
                  parseInt(formValues.treasuryAllocationPercent || "0")}%
                {parseInt(formValues.liquidityAllocationPercent || "0") +
                  parseInt(formValues.treasuryAllocationPercent || "0") > 100 && (
                  <span className="text-destructive ml-2">
                    (Cannot exceed 100%)
                  </span>
                )}
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
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
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

            {/* Submit Button */}
            {!address ? (
              <div className="space-y-3">
                <div className="text-center">
                  <appkit-button />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Connect your wallet to create a launch
                </p>
              </div>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isPending || isConfirming}
                className="w-full h-12 text-base"
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
            )}
      </CardContent>
    </Card>
  );
}

// Form Field Component
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
}

function FormField({ label, value, onChange, placeholder, type = "text", error, hint }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className={error ? "text-destructive" : ""}>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// Success View Component
interface LaunchSuccessViewProps {
  result: LaunchResult;
  chainId: number;
}

function LaunchSuccessView({ result, chainId }: LaunchSuccessViewProps) {
  const getExplorerUrl = (hash: string) => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      11155111: "https://sepolia.etherscan.io",
      8453: "https://basescan.org",
      84532: "https://sepolia.basescan.org",
    };
    return `${explorers[chainId] || "https://etherscan.io"}/tx/${hash}`;
  };

  const getAddressUrl = (address: string) => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      11155111: "https://sepolia.etherscan.io",
      8453: "https://basescan.org",
      84532: "https://sepolia.basescan.org",
    };
    return `${explorers[chainId] || "https://etherscan.io"}/address/${address}`;
  };

  const tokenSourceLabel = TOKEN_SOURCE_OPTIONS.find(
    (o) => o.value.toString() === result.params.tokenSource
  )?.label || result.params.tokenSource;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-600">Launch Created!</CardTitle>
        <CardDescription>
          Your token launch has been successfully deployed
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Transaction Info */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Launch ID</span>
            <span className="text-sm font-semibold text-foreground">
              #{result.launchId.toString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Transaction Hash</span>
            <a
              href={getExplorerUrl(result.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline font-mono"
            >
              {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Orchestrator Address</span>
            <a
              href={getAddressUrl(result.launcherAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline font-mono"
            >
              {result.launcherAddress.slice(0, 10)}...{result.launcherAddress.slice(-8)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <Separator />

        {/* Launch Parameters Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Launch Parameters
          </h3>

          <div className="grid gap-3 text-sm">
            <SummaryRow label="Token" value={result.params.token} mono />
            <SummaryRow label="Payment Token" value={result.params.paymentToken} mono />
            <SummaryRow label="Token Source" value={tokenSourceLabel} />
            <SummaryRow label="Operator" value={result.params.operator} mono />
            <SummaryRow label="Token Amount" value={result.params.tokenAmount} />
            <SummaryRow
              label="Auction Duration"
              value={`${result.params.auctionDurationDays}d ${result.params.auctionDurationHours}h`}
            />
            <SummaryRow label="Pricing Steps" value={result.params.pricingSteps} />
            <SummaryRow label="Reserve Price" value={result.params.reservePrice} />
            <SummaryRow label="Start Time" value={result.params.startTime === "0" ? "Immediate" : result.params.startTime} />
            <SummaryRow
              label="Liquidity Allocation"
              value={`${result.params.liquidityAllocationPercent}%`}
            />
            <SummaryRow
              label="Treasury Allocation"
              value={`${result.params.treasuryAllocationPercent}%`}
            />
            <SummaryRow
              label="Pool Fee Tier"
              value={POOL_FEE_TIERS.find((t) => t.value.toString() === result.params.poolFeeTier)?.label || result.params.poolFeeTier}
            />
            <SummaryRow label="Tick Spacing" value={result.params.tickSpacing} />
            <SummaryRow
              label="Lockup Duration"
              value={`${result.params.lockupDurationDays} days`}
            />
            <SummaryRow
              label="Distribution Delay"
              value={`${result.params.distributionDelayDays} days`}
            />
            <SummaryRow label="Treasury" value={result.params.treasury} mono />
            <SummaryRow label="Position Beneficiary" value={result.params.positionBeneficiary} mono />
            <SummaryRow
              label="Validation Hook"
              value={result.params.validationHook === "0x0000000000000000000000000000000000000000" ? "None" : result.params.validationHook}
              mono={result.params.validationHook !== "0x0000000000000000000000000000000000000000"}
            />
          </div>
        </div>

        {/* Next Steps */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Next Steps</h4>
              <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                <li>Transfer tokens to the orchestrator contract</li>
                <li>Start the auction</li>
                <li>Wait for bidders to participate</li>
                <li>Finalize the auction after duration ends</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.location.reload()}
          >
            Create Another Launch
          </Button>
          <Button
            className="flex-1"
            onClick={() => window.open(getAddressUrl(result.launcherAddress), "_blank")}
          >
            View Orchestrator
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Summary Row Component
function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const displayValue = mono && value.length > 20
    ? `${value.slice(0, 10)}...${value.slice(-8)}`
    : value;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{displayValue}</span>
    </div>
  );
}
