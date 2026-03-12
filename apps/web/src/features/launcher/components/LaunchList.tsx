"use client";

import { useLaunches } from "../hooks/useLaunches";
import { LaunchStateBadge } from "./StateBadge";
import { AddressLink } from "@/components/AddressLink";
import { getEffectiveState } from "../utils/displayState";
import { CHAIN_METADATA } from "@/config/chains";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useBlockNumber, useChainId, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Code, ExternalLink, Plus, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEPLOYED_CHAIN_IDS } from "@launcher/sdk";

interface LaunchListProps {
  chainId?: number;
}

export function LaunchList({ chainId }: LaunchListProps) {
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const connectedChainId = useChainId();
  const resolvedChainId = chainId ?? connectedChainId;
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const isChainSupported = DEPLOYED_CHAIN_IDS.includes(resolvedChainId);
  const { launches, launchCount, factoryAddress, isLoading, error, refetch } = useLaunches(resolvedChainId);
  const { data: blockNumber } = useBlockNumber({ chainId: resolvedChainId, query: { staleTime: 60_000 } });

  const chainMeta = CHAIN_METADATA[resolvedChainId];
  const explorerUrl = chainMeta?.explorerUrl ?? "https://etherscan.io";

  if (!isChainSupported) {
    const targetChainId = DEPLOYED_CHAIN_IDS[0];
    const targetName = CHAIN_METADATA[targetChainId]?.name ?? `Chain ${targetChainId}`;
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-5 py-4 text-yellow-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Chain not supported</p>
            <p className="text-sm mt-1">
              {CHAIN_METADATA[resolvedChainId]?.name ?? `Chain ${resolvedChainId}`} does not have a deployed LaunchFactory.
            </p>
          </div>
        </div>
        <Button
          onClick={() => switchChain({ chainId: targetChainId })}
          variant="default"
        >
          Switch to {targetName}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading launches...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading launches: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Contract source link */}
      {factoryAddress && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
          <Code className="h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">LaunchFactory:</span>
          <a
            href={`${explorerUrl}/address/${factoryAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            {factoryAddress.slice(0, 6)}...{factoryAddress.slice(-4)}
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-border">|</span>
          <a
            href="https://github.com/miltontulli/cca-launcher/tree/main/packages/contracts"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <Code className="h-3 w-3" />
            Source
          </a>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">All Launches</h1>
          {chainMeta && (
            <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {chainMeta.name}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Create CTA */}
      {isConnected ? (
        <Link href="/launches/create" className="block">
          <div className="flex items-center justify-between rounded-lg border border-dashed p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Create a new token launch</p>
                <p className="text-sm text-muted-foreground">Deploy your token with a fair auction and automated liquidity</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      ) : (
        <button type="button" onClick={() => open({ view: "Connect" })} className="w-full text-left">
          <div className="flex items-center justify-between rounded-lg border border-dashed p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Connect wallet to create a launch</p>
                <p className="text-sm text-muted-foreground">Deploy your token with a fair auction and automated liquidity</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </button>
      )}

      {/* Table */}
      {launches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No launches found.</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">Token</th>
                <th className="p-3 font-medium">Operator</th>
                <th className="p-3 font-medium text-right">Token Amount</th>
                <th className="p-3 font-medium text-center">Status</th>
                <th className="p-3 font-medium text-center">Network</th>
              </tr>
            </thead>
            <tbody>
              {[...launches].reverse().map((launch) => {
                const state = blockNumber
                  ? getEffectiveState(launch.state, blockNumber, launch.auctionStartBlock, launch.auctionEndBlock)
                  : launch.state;

                const totalTokens = launch.auctionTokenAmount + launch.liquidityTokenAmount;
                const formattedAmount = formatUnits(totalTokens, launch.tokenDecimals);
                const displayAmount = parseFloat(formattedAmount).toLocaleString();
                const launchUrl = `/launches/${launch.address}?chain=${resolvedChainId}`;

                return (
                  <tr
                    key={launch.address}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(launchUrl)}
                  >
                    <td className="p-3">
                      <span className="text-sm font-medium">#{launch.launchId}</span>
                    </td>
                    <td className="p-3">
                      {launch.token && launch.tokenSymbol !== "—" ? (
                        <a
                          href={`${explorerUrl}/address/${launch.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div>
                            <p className="text-sm font-medium">{launch.tokenSymbol}</p>
                            {launch.tokenName !== "—" && (
                              <p className="text-xs text-muted-foreground">{launch.tokenName}</p>
                            )}
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm font-medium">—</span>
                      )}
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <AddressLink address={launch.operator} chainId={resolvedChainId} />
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm font-medium tabular-nums">{displayAmount}</span>
                      {launch.tokenSymbol !== "—" && (
                        <span className="ml-1 text-sm text-muted-foreground">{launch.tokenSymbol}</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <LaunchStateBadge state={state} />
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-muted border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {chainMeta?.shortName ?? `${resolvedChainId}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
