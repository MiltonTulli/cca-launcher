"use client";

import { useMemo } from "react";
import { Address } from "viem";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import {
  TALLY_LAUNCH_FACTORY_ABI,
  TALLY_LAUNCH_FACTORY_ADDRESSES,
  TALLY_LAUNCH_ORCHESTRATOR_ABI,
  LaunchState,
} from "@/config/contracts";
import { ZERO_ADDRESS } from "@/lib/utils";
import type { SaleEntry } from "@/config/types";

/**
 * Fetches all CCA sales by scanning launches and filtering those
 * with an active/ended auction (state >= AUCTION_ACTIVE) and a non-zero CCA address.
 */
export function useSales() {
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

  // Step 2: Get all orchestrator addresses
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

  const launchAddresses = useMemo(() => {
    if (!addressResults) return [];
    return addressResults
      .map((r) => r.result as Address | undefined)
      .filter((addr): addr is Address => !!addr && addr !== ZERO_ADDRESS);
  }, [addressResults]);

  // Step 3: Get state, token, launchId, and auctionInfo per orchestrator
  const FIELDS_PER_LAUNCH = 4;
  const detailContracts = useMemo(() => {
    if (launchAddresses.length === 0) return [];
    return launchAddresses.flatMap((addr) => [
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "state" as const },
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "token" as const },
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "launchId" as const },
      { address: addr, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, functionName: "getAuctionInfo" as const },
    ]);
  }, [launchAddresses]);

  const { data: detailResults, isLoading: isLoadingDetails } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: detailContracts.length > 0, staleTime: 30_000 },
  });

  // Step 4: Parse and filter
  const sales: SaleEntry[] = useMemo(() => {
    if (launchAddresses.length === 0 || !detailResults) return [];

    const result: SaleEntry[] = [];
    for (let i = 0; i < launchAddresses.length; i++) {
      const base = i * FIELDS_PER_LAUNCH;
      const state = (detailResults[base]?.result as number | undefined) ?? 0;
      const token = detailResults[base + 1]?.result as Address | undefined;
      const launchId = detailResults[base + 2]?.result as bigint | undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const auctionInfo = detailResults[base + 3]?.result as any;

      if (state < LaunchState.AUCTION_ACTIVE) continue;
      if (!auctionInfo) continue;

      const ccaAddress = auctionInfo.cca as Address | undefined;
      if (!ccaAddress || ccaAddress === ZERO_ADDRESS) continue;

      result.push({
        ccaAddress,
        orchestratorAddress: launchAddresses[i],
        token: token ?? (ZERO_ADDRESS as Address),
        launchId: launchId ?? BigInt(0),
        launchState: state,
        startTime: auctionInfo.startTime ?? BigInt(0),
        endTime: auctionInfo.endTime ?? BigInt(0),
        currentPrice: auctionInfo.currentPrice ?? BigInt(0),
        tokensSold: auctionInfo.tokensSold ?? BigInt(0),
        totalRaised: auctionInfo.totalRaised ?? BigInt(0),
        isActive: auctionInfo.isActive ?? false,
        hasEnded: auctionInfo.hasEnded ?? false,
      });
    }
    return result;
  }, [launchAddresses, detailResults]);

  const isLoading = isLoadingCount || isLoadingAddresses || isLoadingDetails;

  return { sales, isLoading, refetch };
}
