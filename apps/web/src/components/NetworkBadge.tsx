"use client";

import { useChainId } from "wagmi";

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  11155111: "Sepolia",
  8453: "Base",
  84532: "Base Sepolia",
};

export function NetworkBadge() {
  const chainId = useChainId();
  const name = CHAIN_NAMES[chainId] ?? "Unknown";

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {name}
      </span>
    </div>
  );
}
