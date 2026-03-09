"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import {
  CCA_AUCTION_ABI,
  ERC20_EXTENDED_ABI,
  LaunchState,
  TALLY_LAUNCH_FACTORY_ABI,
  TALLY_LAUNCH_FACTORY_ADDRESSES,
  TALLY_LAUNCH_ORCHESTRATOR_ABI,
} from "@/config/contracts";
import type { AuctionEntry } from "@/config/types";
import { ZERO_ADDRESS } from "@/lib/utils";
import { useResolvedChainId } from "./useResolvedChainId";

/**
 * Fetches all CCA auctions by scanning launches and filtering those
 * with an active/ended auction (state >= AUCTION_ACTIVE) and a non-zero CCA address.
 */
export function useAuctions(overrideChainId?: number) {
  const chainId = useResolvedChainId(overrideChainId);
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
    chainId,
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
      chainId,
    }));
  }, [count, contractAddress, chainId]);

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
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "state" as const,
        chainId,
      },
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "token" as const,
        chainId,
      },
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "launchId" as const,
        chainId,
      },
      {
        address: addr,
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: "getAuctionInfo" as const,
        chainId,
      },
    ]);
  }, [launchAddresses, chainId]);

  const { data: detailResults, isLoading: isLoadingDetails } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: detailContracts.length > 0, staleTime: 30_000 },
  });

  // Step 4: Parse and filter (without metadata)
  const baseAuctions = useMemo(() => {
    if (launchAddresses.length === 0 || !detailResults) return [];

    const result: Omit<
      AuctionEntry,
      "tokenSymbol" | "tokenDecimals" | "currencySymbol" | "currencyDecimals"
    >[] = [];
    for (let i = 0; i < launchAddresses.length; i++) {
      const base = i * FIELDS_PER_LAUNCH;
      const state = (detailResults[base]?.result as number | undefined) ?? 0;
      const token = detailResults[base + 1]?.result as Address | undefined;
      const launchId = detailResults[base + 2]?.result as bigint | undefined;

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
        chainId,
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
  }, [launchAddresses, detailResults, chainId]);

  // Step 5: Fetch currency address from each CCA contract
  const currencyContracts = useMemo(() => {
    if (baseAuctions.length === 0) return [];
    return baseAuctions.map((a) => ({
      address: a.ccaAddress,
      abi: CCA_AUCTION_ABI,
      functionName: "currency" as const,
      chainId,
    }));
  }, [baseAuctions, chainId]);

  const { data: currencyResults, isLoading: isLoadingCurrency } = useReadContracts({
    contracts: currencyContracts,
    query: { enabled: currencyContracts.length > 0, staleTime: 60_000 },
  });

  const currencyByAuction = useMemo(() => {
    const map = new Map<Address, Address>();
    if (!currencyResults) return map;
    for (let i = 0; i < baseAuctions.length; i++) {
      const curr = currencyResults[i]?.result as Address | undefined;
      if (curr) map.set(baseAuctions[i].ccaAddress, curr);
    }
    return map;
  }, [baseAuctions, currencyResults]);

  // Step 6: Fetch token + currency metadata (symbol + name + decimals) for all unique addresses
  const META_FIELDS = 3;
  const uniqueAddresses = useMemo(() => {
    const set = new Set<Address>();
    for (const a of baseAuctions) {
      if (a.token && a.token !== ZERO_ADDRESS) set.add(a.token);
    }
    for (const curr of currencyByAuction.values()) {
      if (curr && curr !== ZERO_ADDRESS) set.add(curr);
    }
    return Array.from(set);
  }, [baseAuctions, currencyByAuction]);

  const metaContracts = useMemo(() => {
    if (uniqueAddresses.length === 0) return [];
    return uniqueAddresses.flatMap((addr) => [
      { address: addr, abi: ERC20_EXTENDED_ABI, functionName: "symbol" as const, chainId },
      { address: addr, abi: ERC20_EXTENDED_ABI, functionName: "name" as const, chainId },
      { address: addr, abi: ERC20_EXTENDED_ABI, functionName: "decimals" as const, chainId },
    ]);
  }, [uniqueAddresses, chainId]);

  const { data: metaResults, isLoading: isLoadingMeta } = useReadContracts({
    contracts: metaContracts,
    query: { enabled: metaContracts.length > 0, staleTime: 60_000 },
  });

  const metaMap = useMemo(() => {
    const map = new Map<Address, { symbol?: string; name?: string; decimals?: number }>();
    if (!metaResults) return map;
    for (let i = 0; i < uniqueAddresses.length; i++) {
      const base = i * META_FIELDS;
      map.set(uniqueAddresses[i], {
        symbol: metaResults[base]?.result as string | undefined,
        name: metaResults[base + 1]?.result as string | undefined,
        decimals: metaResults[base + 2]?.result as number | undefined,
      });
    }
    return map;
  }, [uniqueAddresses, metaResults]);

  // Step 7: Merge metadata into auctions
  const auctions: AuctionEntry[] = useMemo(() => {
    return baseAuctions.map((a) => {
      const tokenMeta = metaMap.get(a.token);
      const currencyAddr = currencyByAuction.get(a.ccaAddress);
      const currencyMeta = currencyAddr ? metaMap.get(currencyAddr) : undefined;
      return {
        ...a,
        tokenSymbol: tokenMeta?.symbol,
        tokenName: tokenMeta?.name,
        tokenDecimals: tokenMeta?.decimals,
        currencySymbol: currencyMeta?.symbol,
        currencyDecimals: currencyMeta?.decimals,
      };
    });
  }, [baseAuctions, metaMap, currencyByAuction]);

  const isLoading =
    isLoadingCount || isLoadingAddresses || isLoadingDetails || isLoadingCurrency || isLoadingMeta;

  return { auctions, isLoading, refetch, chainId };
}
