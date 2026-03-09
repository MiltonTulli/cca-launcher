import { ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LAUNCH_STATE_COLORS, LAUNCH_STATE_LABELS } from "@/config/contracts";
import type { LaunchEntry } from "@/hooks/useLaunches";
import { shortenAddress } from "@/lib/utils";

interface LaunchCardProps {
  launch: LaunchEntry;
  explorerUrl: string;
  actionLabel?: string;
  showOperator?: boolean;
  chainId?: number;
}

export function LaunchCard({
  launch,
  explorerUrl,
  actionLabel = "View Details",
  showOperator = false,
  chainId,
}: LaunchCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Launch #{launch.launchId.toString()}</CardTitle>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              LAUNCH_STATE_COLORS[launch.state]
            }`}
          >
            {LAUNCH_STATE_LABELS[launch.state]}
          </span>
        </div>
        <CardDescription className="font-mono text-xs">
          {launch.orchestratorAddress}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Token</span>
            <a
              href={`${explorerUrl}/address/${launch.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
            >
              {shortenAddress(launch.token)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {showOperator && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Operator</span>
              <a
                href={`${explorerUrl}/address/${launch.operator}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
              >
                {shortenAddress(launch.operator)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Token Amount</span>
            <span className="font-mono text-xs">{formatUnits(launch.tokenAmount, 18)}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-muted-foreground">Orchestrator</span>
            <a
              href={`${explorerUrl}/address/${launch.orchestratorAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
            >
              View on Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="pt-3">
            <Link
              href={`/launches/${launch.orchestratorAddress}${chainId ? `?chain=${chainId}` : ""}`}
            >
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-4 w-4" />
                {actionLabel}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
