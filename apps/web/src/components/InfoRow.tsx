"use client";

import { ExternalLink } from "lucide-react";
import { useEnsName } from "@/hooks/useEnsName";
import { shortenAddress, ZERO_ADDRESS } from "@/lib/utils";

interface InfoRowProps {
  label: string;
  value: string;
  isAddress?: boolean;
  explorerUrl?: string;
  /** Optional symbol shown before the address (e.g. "USDC") */
  prefix?: string;
  /** If true, value is a block number and links to the block explorer */
  isBlock?: boolean;
}

function AddressDisplay({ address, explorerUrl, prefix }: { address: string; explorerUrl: string; prefix?: string }) {
  const ensName = useEnsName(address);

  if (address === ZERO_ADDRESS) {
    return (
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-xs font-medium text-foreground">{prefix}</span>}
        <span className="text-sm font-medium text-foreground">Native ETH</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {prefix && <span className="text-xs font-medium text-foreground">{prefix}</span>}
      <a
        href={`${explorerUrl}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline truncate"
      >
        {ensName ?? shortenAddress(address)}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    </div>
  );
}

export function InfoRow({ label, value, isAddress: isAddr, explorerUrl, prefix, isBlock }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-border last:border-0 gap-1 sm:gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      {isAddr && explorerUrl ? (
        <AddressDisplay address={value} explorerUrl={explorerUrl} prefix={prefix} />
      ) : isBlock && explorerUrl ? (
        <a
          href={`${explorerUrl}/block/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
        >
          {Number(value).toLocaleString()}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <span className="text-sm font-medium text-foreground text-right truncate">{value}</span>
      )}
    </div>
  );
}
