"use client";

import { ExternalLink, Factory, Github } from "lucide-react";
import { TALLY_LAUNCH_FACTORY_ADDRESSES } from "@/config/contracts";
import { useViewChain } from "@/context/ViewChainProvider";
import { getExplorerUrl, shortenAddress, ZERO_ADDRESS } from "@/lib/utils";

const FACTORY_SOURCE_URL =
  "https://github.com/withtally/orchestrator/blob/main/orchestrator/src/TallyLaunchFactory.sol";

export function FactoryBanner() {
  const { viewChainId: chainId } = useViewChain();
  const address = TALLY_LAUNCH_FACTORY_ADDRESSES[chainId];

  if (!address || address === ZERO_ADDRESS) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-muted/50 px-4 py-2.5 flex-wrap">
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
      <span className="text-border">|</span>
      <a
        href={FACTORY_SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Github className="h-3.5 w-3.5 shrink-0" />
        Source
      </a>
    </div>
  );
}
