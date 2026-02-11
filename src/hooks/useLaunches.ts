"use client";

import { useMemo } from "react";
import { Address } from "viem";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import {
  TALLY_LAUNCH_FACTORY_ABI,
  TALLY_LAUNCH_FACTORY_ADDRESSES,
  TALLY_LAUNCH_ORCHESTRATOR_ABI,
  ERC20_ABI,
  LaunchState,
} from "@/config/contracts";
import { ZERO_ADDRESS } from "@/lib/utils";

export interface LaunchEntry {
  orchestratorAddress: Address;
  operator: Address;
  state: LaunchState;
  token: Address;
  launchId: bigint;
  tokenAmount: bigint;
  tokenSymbol?: string;
  tokenDecimals?: number;
}

/**
 * Fetches all launches from the factory using launchCount + getLaunch(id).
 * Returns launch details via multicall on each orchestrator.
 */
export function useLaunches() {
  const chainId = useChainId();
  const contractAddress = TALLY_LAUNCH_FACTORY_ADDRESSES[chainId];
  const enabled = !!contractAddress && contractAddress !== ZERO_ADDRESS;

  // Step 1: Get launch count
  const {
    data: launchCount,
    isLoading: isLoadingCount,
    refetch,
  } = useReadContract({
    address: contractAddress,
    abi: TALLY_LAUNCH_FACTORY_ABI,
    functionName: "getLaunchCount",
    query: { enabled, staleTime: 30_000 },
  });

  const count = typeof launchCount === "bigint" ? Number(launchCount) : 0;

  // Step 2: Multicall getLaunch(0), getLaunch(1), ..., getLaunch(count-1)
  const addressContracts = useMemo(() => {
    if (count === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      address: contractAddress,
      abi: TALLY_LAUNCH_FACTORY_ABI,
      functionName: "getLaunch" as const,
      args: [BigInt(i)] as const,
    }));
  }, [count, contractAddress]);

  const { data: addressResults, isLoading: isLoadingAddresses } = useReadContracts({
    contracts: addressContracts,
    query: { enabled: addressContracts.length > 0, staleTime: 30_000 },
  });

  // Step 3: Extract orchestrator addresses
  const launchAddresses = useMemo(() => {
    if (!addressResults) return [];
    return addressResults
      .map((r) => r.result as Address | undefined)
      .filter((addr): addr is Address => !!addr && addr !== ZERO_ADDRESS);
  }, [addressResults]);

  // Step 4: Multicall orchestrator details for each address
  const FIELDS_PER_LAUNCH = 5;
  const detailContracts = useMemo(() => {
    if (launchAddresses.length === 0) return [];
    return launchAddresses.flatMap((addr) => [
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "operator" as const },
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "state" as const },
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "token" as const },
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "launchId" as const },
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "tokenAmount" as const },
    ]);
  }, [launchAddresses]);

  const { data: detailResults, isLoading: isLoadingDetails } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: detailContracts.length > 0, staleTime: 30_000 },
  });

  // Step 5: Parse results (without metadata)
  const baseLaunches = useMemo(() => {
    if (launchAddresses.length === 0 || !detailResults) return [];

    const result: Omit<LaunchEntry, "tokenSymbol" | "tokenDecimals">[] = [];
    for (let i = 0; i < launchAddresses.length; i++) {
      const base = i * FIELDS_PER_LAUNCH;
      const operator = detailResults[base]?.result as Address | undefined;
      const state = detailResults[base + 1]?.result as number | undefined;
      const token = detailResults[base + 2]?.result as Address | undefined;
      const launchId = detailResults[base + 3]?.result as bigint | undefined;
      const tokenAmount = detailResults[base + 4]?.result as bigint | undefined;

      result.push({
        orchestratorAddress: launchAddresses[i],
        operator: operator ?? ("0x0" as Address),
        state: (state ?? 0) as LaunchState,
        token: token ?? ("0x0" as Address),
        launchId: launchId ?? BigInt(0),
        tokenAmount: tokenAmount ?? BigInt(0),
      });
    }
    return result;
  }, [launchAddresses, detailResults]);

  // Step 6: Fetch token metadata (symbol + decimals) for each unique token
  const META_FIELDS = 2;
  const uniqueTokens = useMemo(() => {
    const set = new Set<Address>();
    for (const l of baseLaunches) {
      if (l.token && l.token !== ZERO_ADDRESS && l.token !== ("0x0" as Address)) set.add(l.token);
    }
    return Array.from(set);
  }, [baseLaunches]);

  const metaContracts = useMemo(() => {
    if (uniqueTokens.length === 0) return [];
    return uniqueTokens.flatMap((addr) => [
      { address: addr, abi: ERC20_ABI, functionName: "symbol" as const },
      { address: addr, abi: ERC20_ABI, functionName: "decimals" as const },
    ]);
  }, [uniqueTokens]);

  const { data: metaResults, isLoading: isLoadingMeta } = useReadContracts({
    contracts: metaContracts,
    query: { enabled: metaContracts.length > 0, staleTime: 60_000 },
  });

  const tokenMetaMap = useMemo(() => {
    const map = new Map<Address, { symbol?: string; decimals?: number }>();
    if (!metaResults) return map;
    for (let i = 0; i < uniqueTokens.length; i++) {
      const base = i * META_FIELDS;
      map.set(uniqueTokens[i], {
        symbol: metaResults[base]?.result as string | undefined,
        decimals: metaResults[base + 1]?.result as number | undefined,
      });
    }
    return map;
  }, [uniqueTokens, metaResults]);

  // Step 7: Merge metadata into launches
  const launches: LaunchEntry[] = useMemo(() => {
    return baseLaunches.map((l) => {
      const meta = tokenMetaMap.get(l.token);
      return {
        ...l,
        tokenSymbol: meta?.symbol,
        tokenDecimals: meta?.decimals,
      };
    });
  }, [baseLaunches, tokenMetaMap]);

  const isLoading = isLoadingCount || isLoadingAddresses || isLoadingDetails || isLoadingMeta;

  return { launches, isLoading, refetch };
}
