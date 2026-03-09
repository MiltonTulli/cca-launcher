"use client";

import { CheckCircle2, ExternalLink, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SummaryRow } from "@/components/SummaryRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { POOL_FEE_TIERS, TOKEN_SOURCE_OPTIONS } from "@/config/contracts";
import type { LaunchResult } from "@/hooks/useLaunchForm";
import { getExplorerUrl } from "@/lib/utils";

export interface LaunchSuccessViewProps {
  result: LaunchResult;
  chainId: number;
}

export function LaunchSuccessView({ result, chainId }: LaunchSuccessViewProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const launchPath = `/launches/${result.launcherAddress}`;

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push(launchPath);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router, launchPath]);

  const txExplorerUrl = getExplorerUrl(chainId, "tx", result.txHash);

  const getAddressUrl = (address: string) => getExplorerUrl(chainId, "address", address);

  const tokenSourceLabel =
    TOKEN_SOURCE_OPTIONS.find((o) => o.value.toString() === result.params.tokenSource)?.label ||
    result.params.tokenSource;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-600">Launch Created!</CardTitle>
        <CardDescription>Your token launch has been successfully deployed</CardDescription>
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
              href={txExplorerUrl}
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
            <SummaryRow
              label="Start Time"
              value={result.params.startTime === "0" ? "Immediate" : result.params.startTime}
            />
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
              value={
                POOL_FEE_TIERS.find((t) => t.value.toString() === result.params.poolFeeTier)
                  ?.label || result.params.poolFeeTier
              }
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
            <SummaryRow
              label="Position Beneficiary"
              value={result.params.positionBeneficiary}
              mono
            />
            <SummaryRow
              label="Validation Hook"
              value={
                result.params.validationHook === "0x0000000000000000000000000000000000000000"
                  ? "None"
                  : result.params.validationHook
              }
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
        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={() => router.push(launchPath)}>
            Go to Launch
            <ExternalLink className="h-4 w-4" />
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Redirecting in {countdown}s...
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
              Create Another Launch
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(getAddressUrl(result.launcherAddress), "_blank")}
            >
              View on Explorer
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
