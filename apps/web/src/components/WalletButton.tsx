"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Wallet } from "lucide-react";

function shortenAddr(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface WalletButtonProps {
  size?: "sm" | "lg";
}

export function WalletButton({ size = "sm" }: WalletButtonProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const handleClick = () => {
    open({ view: isConnected ? "Account" : "Connect" });
  };

  if (!isConnected) {
    if (size === "lg") {
      return (
        <button
          onClick={handleClick}
          type="button"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm cursor-pointer"
        >
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </button>
      );
    }

    return (
      <button
        onClick={handleClick}
        type="button"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors text-xs font-medium text-foreground shadow-sm cursor-pointer"
      >
        <Wallet className="h-3.5 w-3.5" />
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors text-xs font-medium text-foreground font-mono shadow-sm cursor-pointer"
    >
      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
      {address ? shortenAddr(address) : "Connected"}
    </button>
  );
}
