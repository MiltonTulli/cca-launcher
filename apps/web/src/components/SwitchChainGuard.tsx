"use client";

import { AlertTriangle } from "lucide-react";
import type React from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { CHAIN_METADATA } from "@/config/chains";

interface SwitchChainGuardProps {
  requiredChainId: number;
  children: React.ReactNode;
}

export function SwitchChainGuard({ requiredChainId, children }: SwitchChainGuardProps) {
  const walletChainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (walletChainId === requiredChainId) {
    return <>{children}</>;
  }

  const chainName = CHAIN_METADATA[requiredChainId]?.name ?? `Chain ${requiredChainId}`;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Wrong network</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
            This action requires your wallet to be on {chainName}.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={isPending}
        onClick={() => switchChain({ chainId: requiredChainId })}
      >
        {isPending ? "Switching..." : `Switch to ${chainName}`}
      </Button>
    </div>
  );
}
