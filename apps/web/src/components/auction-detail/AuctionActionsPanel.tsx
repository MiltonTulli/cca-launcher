"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CCA_AUCTION_ABI, CCAPhase } from "@/config/contracts";

interface AuctionActionsPanelProps {
  ccaAddress: Address;
  phase: CCAPhase;
  onRefresh: () => void;
}

export function AuctionActionsPanel({ ccaAddress, phase, onRefresh }: AuctionActionsPanelProps) {
  if (phase < CCAPhase.ENDED) return null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Admin Actions
      </h3>
      <div className="grid gap-2 grid-cols-2">
        <SweepButton
          label="Sweep Funds"
          functionName="sweepCurrency"
          ccaAddress={ccaAddress}
          onSuccess={onRefresh}
        />
        <SweepButton
          label="Sweep Tokens"
          functionName="sweepUnsoldTokens"
          ccaAddress={ccaAddress}
          onSuccess={onRefresh}
        />
      </div>
    </div>
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
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
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
              ? `${error.message.slice(0, 80)}...`
              : error.message}
        </p>
      )}
    </div>
  );
}
