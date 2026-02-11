"use client";

import { useChainId } from "wagmi";
import { ExternalLink, Factory } from "lucide-react";
import { TALLY_LAUNCH_FACTORY_ADDRESSES } from "@/config/contracts";
import { ZERO_ADDRESS, shortenAddress, getExplorerUrl } from "@/lib/utils";

export function FactoryBanner() {
  const chainId = useChainId();
  const address = TALLY_LAUNCH_FACTORY_ADDRESSES[chainId];

  if (!address || address === ZERO_ADDRESS) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-muted/50 px-4 py-2.5">
      <Factory className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground">TallyLaunchFactory:</span>
      <a
        href={getExplorerUrl(chainId, "address", address)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
      >
        {shortenAddress(address)}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    </div>
  );
}
