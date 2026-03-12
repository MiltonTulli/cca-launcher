"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, FlaskConical, XCircle } from "lucide-react";
import { encodeFunctionData } from "viem";
import type { Address, Abi } from "viem";
import { useAccount, useChainId } from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type SimulationResult, simulateTransaction } from "@/lib/simulate";
import { parseTxError } from "@/lib/txError";

interface ActionButtonProps {
  label: string;
  onClick: () => Promise<unknown>;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary";
  className?: string;
  /** Enable Tenderly simulation */
  simulate?: {
    abi: Abi;
    functionName: string;
    contractAddress: Address;
    args?: readonly unknown[];
    chainId?: number;
    value?: bigint;
  };
}

export function ActionButton({ label, onClick, disabled, variant = "default", className, simulate }: ActionButtonProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "confirming" | "success" | "error">("idle");
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const { address: from } = useAccount();
  const connectedChainId = useChainId();

  const handleClick = async () => {
    setStatus("pending");
    try {
      await onClick();
      setStatus("success");
      toast.success(`${label} submitted`);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      const { title, description } = parseTxError(err);
      toast.error(title, { description });
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleSimulate = async () => {
    if (!from || !simulate) return;
    setSimulating(true);
    setSimResult(null);
    setSimError(null);

    try {
      const input = encodeFunctionData({
        abi: simulate.abi,
        functionName: simulate.functionName,
        args: simulate.args ?? [],
      });

      const result = await simulateTransaction({
        from,
        to: simulate.contractAddress,
        input,
        networkId: simulate.chainId ?? connectedChainId,
        value: simulate.value ? simulate.value.toString() : undefined,
      });

      setSimResult(result);
    } catch (err) {
      setSimError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  const buttonLabel = {
    idle: label,
    pending: "Confirm in wallet...",
    confirming: "Confirming...",
    success: "Success!",
    error: "Failed",
  }[status];

  return (
    <div className="space-y-1">
      <Button
        onClick={handleClick}
        disabled={disabled || status === "pending" || status === "confirming"}
        variant={status === "error" ? "destructive" : variant}
        className={className}
      >
        {(status === "pending" || status === "confirming") && (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {buttonLabel}
      </Button>

      {simulate && from && (
        <div className="mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSimulate}
            disabled={simulating || disabled}
            className="w-full"
          >
            {simulating ? (
              <>
                <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Simulating...
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4 mr-1" />
                Simulate on Tenderly
              </>
            )}
          </Button>
          {simResult && (
            <div
              className={`mt-1.5 text-xs rounded-lg border p-2.5 ${
                simResult.success
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium flex items-center gap-1">
                  {simResult.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  {simResult.success ? "Simulation passed" : "Simulation failed"}
                </span>
                {simResult.gasUsed > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    Gas: {simResult.gasUsed.toLocaleString()}
                  </span>
                )}
              </div>
              {simResult.error && (
                <p className="mt-1 text-[11px] leading-tight">{simResult.error}</p>
              )}
              {simResult.errorInfo?.error_message && (
                <p className="mt-1 text-[11px] leading-tight font-mono">
                  {simResult.errorInfo.error_message}
                </p>
              )}
              <a
                href={simResult.simulationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[11px] underline hover:no-underline"
              >
                View in Tenderly
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
          {simError && <p className="mt-1 text-xs text-red-600">{simError}</p>}
        </div>
      )}
    </div>
  );
}
