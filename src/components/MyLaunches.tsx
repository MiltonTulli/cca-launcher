"use client";

import { useMemo } from "react";
import { Address, formatUnits } from "viem";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  TALLY_LAUNCH_FACTORY_ABI,
  TALLY_LAUNCH_FACTORY_ADDRESSES,
  TALLY_LAUNCH_ORCHESTRATOR_ABI,
  LaunchState,
  LAUNCH_STATE_LABELS,
  LAUNCH_STATE_COLORS,
} from "@/config/contracts";
import { ExternalLink, Rocket, RefreshCw } from "lucide-react";

interface MyLaunchesProps {
  onNavigateToNewLaunch: () => void;
}

const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  8453: "https://basescan.org",
  84532: "https://sepolia.basescan.org",
};

export function MyLaunches({ onNavigateToNewLaunch }: MyLaunchesProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contractAddress = TALLY_LAUNCH_FACTORY_ADDRESSES[chainId];
  const explorerUrl = EXPLORER_URLS[chainId] || "https://etherscan.io";

  // 1. Fetch all launch addresses from factory
  const {
    data: allLaunches,
    isLoading: isLoadingLaunches,
    refetch,
  } = useReadContract({
    address: contractAddress,
    abi: TALLY_LAUNCH_FACTORY_ABI,
    functionName: "getAllLaunches",
    query: {
      enabled: !!contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // 2. Build multicall contracts for each launch address
  const multicallContracts = useMemo(() => {
    if (!allLaunches || allLaunches.length === 0) return [];

    return allLaunches.flatMap((addr: Address) => [
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "operator" as const,
      },
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "state" as const,
      },
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "token" as const,
      },
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "launchId" as const,
      },
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "tokenAmount" as const,
      },
    ]);
  }, [allLaunches]);

  const { data: multicallResults, isLoading: isLoadingDetails } = useReadContracts({
    contracts: multicallContracts,
    query: {
      enabled: multicallContracts.length > 0,
    },
  });

  // 3. Parse multicall results and filter by connected wallet
  const FIELDS_PER_LAUNCH = 5;
  const myLaunches = useMemo(() => {
    if (!allLaunches || !multicallResults || !address) return [];

    const launches = [];
    for (let i = 0; i < allLaunches.length; i++) {
      const base = i * FIELDS_PER_LAUNCH;
      const operator = multicallResults[base]?.result as Address | undefined;
      const state = multicallResults[base + 1]?.result as number | undefined;
      const token = multicallResults[base + 2]?.result as Address | undefined;
      const launchId = multicallResults[base + 3]?.result as bigint | undefined;
      const tokenAmount = multicallResults[base + 4]?.result as bigint | undefined;

      if (operator?.toLowerCase() === address.toLowerCase()) {
        launches.push({
          orchestratorAddress: allLaunches[i],
          operator,
          state: (state ?? 0) as LaunchState,
          token: token ?? ("0x0" as Address),
          launchId: launchId ?? BigInt(0),
          tokenAmount: tokenAmount ?? BigInt(0),
        });
      }
    }

    return launches;
  }, [allLaunches, multicallResults, address]);

  const isLoading = isLoadingLaunches || isLoadingDetails;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your launches...</p>
      </div>
    );
  }

  if (myLaunches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Rocket className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">No launches yet</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center">
          You haven&apos;t created any token launches. Get started by creating your first one.
        </p>
        <Button onClick={onNavigateToNewLaunch} className="mt-6">
          <Rocket className="h-4 w-4" />
          Create your first launch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Launches</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {myLaunches.length} launch{myLaunches.length !== 1 ? "es" : ""} found
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {myLaunches.map((launch) => (
          <Card key={launch.orchestratorAddress}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Launch #{launch.launchId.toString()}
                </CardTitle>
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
                    {launch.token.slice(0, 10)}...{launch.token.slice(-8)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Token Amount</span>
                  <span className="font-mono text-xs">
                    {formatUnits(launch.tokenAmount, 18)}
                  </span>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
