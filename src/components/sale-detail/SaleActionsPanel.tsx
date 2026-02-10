"use client";

import { useState, useEffect } from "react";
import { Address } from "viem";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2 } from "lucide-react";
import { CCA_AUCTION_ABI, CCAPhase } from "@/config/contracts";

interface SaleActionsPanelProps {
  ccaAddress: Address;
  phase: CCAPhase;
  onRefresh: () => void;
}

export function SaleActionsPanel({
  ccaAddress,
  phase,
  onRefresh,
}: SaleActionsPanelProps) {
  if (phase < CCAPhase.ENDED) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Admin Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <SweepButton
            label="Sweep Funds"
            functionName="sweepFunds"
            ccaAddress={ccaAddress}
            onSuccess={onRefresh}
          />
          <SweepButton
            label="Sweep Tokens"
            functionName="sweepTokens"
            ccaAddress={ccaAddress}
            onSuccess={onRefresh}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SweepButton({
  label,
  functionName,
  ccaAddress,
  onSuccess,
}: {
  label: string;
  functionName: string;
  ccaAddress: Address;
  onSuccess: () => void;
}) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      onSuccess();
      const timer = setTimeout(() => reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess, reset]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        disabled={isPending || isConfirming}
        onClick={() => {
          reset();
          writeContract({
            address: ccaAddress,
            abi: CCA_AUCTION_ABI,
            functionName: functionName as never,
          });
        }}
      >
        {isPending || isConfirming ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            {isPending ? "Confirm..." : "Confirming..."}
          </span>
        ) : isSuccess ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Done
          </span>
        ) : (
          label
        )}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error.message.includes("User rejected")
            ? "Rejected"
            : error.message.length > 80
              ? error.message.slice(0, 80) + "..."
              : error.message}
        </p>
      )}
    </div>
  );
}
