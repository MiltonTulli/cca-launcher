"use client";

import { CheckCircle2, ExternalLink, FlaskConical, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { type Address, encodeFunctionData } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TALLY_LAUNCH_ORCHESTRATOR_ABI } from "@/config/contracts";
import { type SimulationResult, simulateTransaction } from "@/lib/simulate";

interface ActionButtonProps {
  label: string;
  functionName: string;
  contractAddress: Address;
  args?: readonly unknown[];
  gas?: bigint;
  disabled?: boolean;
  variant?: "default" | "outline" | "destructive";
  onSuccess?: () => void;
  simulatable?: boolean;
}

export function ActionButton({
  label,
  functionName,
  contractAddress,
  args,
  gas,
  disabled,
  variant = "default",
  onSuccess,
  simulatable,
}: ActionButtonProps) {
  const { address: from } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
      const timer = setTimeout(() => reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess, reset]);

  const handleClick = () => {
    reset();
    writeContract({
      address: contractAddress,
      abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
      functionName: functionName as never,
      ...(args ? { args: args as never } : {}),
      ...(gas ? { gas } : {}),
    });
  };

  const handleSimulate = async () => {
    if (!from) return;
    setSimulating(true);
    setSimResult(null);
    setSimError(null);

    try {
      const input = encodeFunctionData({
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: functionName as never,
        ...(args ? { args: args as never } : {}),
      });

      const result = await simulateTransaction({
        from,
        to: contractAddress,
        input,
        networkId: chainId,
        gas: gas ? Number(gas) : undefined,
      });

      setSimResult(result);
    } catch (err) {
      setSimError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        disabled={disabled || isPending || isConfirming}
        onClick={handleClick}
        className="w-full"
      >
        {isPending || isConfirming ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            {isPending ? "Confirm in wallet..." : "Confirming..."}
          </span>
        ) : isSuccess ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Success
          </span>
        ) : (
          label
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-600" title={error.message}>
          {error.message.includes("User rejected")
            ? "Transaction rejected"
            : (() => {
                const revertMatch = error.message.match(/reason:\s*(.+?)(?:\n|$)/);
                const solidityMatch = error.message.match(/reverted with custom error '([^']+)'/);
                const shortMessage = error.message.match(/Details:\s*(.+?)(?:\n|$)/);
                const reason = revertMatch?.[1] || solidityMatch?.[1] || shortMessage?.[1];
                if (reason) return reason.trim();
                return error.message.length > 120
                  ? `${error.message.slice(0, 120)}...`
                  : error.message;
              })()}
        </p>
      )}
      {simulatable && from && (
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
                <Spinner size="sm" />
                Simulating...
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4" />
                Simulate
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
