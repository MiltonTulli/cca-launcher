"use client";

import { useMemo } from "react";
import { Address } from "viem";
import { useReadContracts } from "wagmi";
import {
  CCA_AUCTION_ABI,
  ERC20_EXTENDED_ABI,
  LaunchState,
  STANDALONE_CCA_ADDRESSES,
} from "@/config/contracts";
import { ZERO_ADDRESS } from "@/lib/utils";
import type { AuctionEntry } from "@/config/types";
import { useResolvedChainId } from "./useResolvedChainId";

/**
 * Fetches auction data for standalone CCA contracts that were deployed
 * outside the TallyLaunchFactory orchestrator pipeline.
 */
export function useStandaloneAuctions(overrideChainId?: number) {
  const chainId = useResolvedChainId(overrideChainId);
  const addresses = STANDALONE_CCA_ADDRESSES[chainId] ?? [];

  // Step 1: Read core CCA fields for each standalone address
  const FIELDS_PER_CCA = 7;
  const ccaContracts = useMemo(() => {
    if (addresses.length === 0) return [];
    return addresses.flatMap((addr) => [
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "token" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "currency" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "totalSupply" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "startBlock" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "endBlock" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "clearingPrice" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "currencyRaised" as const, chainId },
    ]);
  }, [addresses, chainId]);

  const { data: ccaResults, isLoading: isLoadingCCA } = useReadContracts({
    contracts: ccaContracts,
    query: { enabled: ccaContracts.length > 0, staleTime: 30_000 },
  });

  // Step 2: Parse base auction data
  const baseAuctions = useMemo(() => {
    if (addresses.length === 0 || !ccaResults) return [];

    return addresses.map((ccaAddress, i) => {
      const base = i * FIELDS_PER_CCA;
      const token = (ccaResults[base]?.result as Address | undefined) ?? (ZERO_ADDRESS as Address);
      const currency = (ccaResults[base + 1]?.result as Address | undefined) ?? (ZERO_ADDRESS as Address);
      const startBlock = (ccaResults[base + 3]?.result as bigint | undefined) ?? BigInt(0);
      const endBlock = (ccaResults[base + 4]?.result as bigint | undefined) ?? BigInt(0);
      const clearingPrice = (ccaResults[base + 5]?.result as bigint | undefined) ?? BigInt(0);
      const currencyRaised = (ccaResults[base + 6]?.result as bigint | undefined) ?? BigInt(0);

      // Derive activity status from block numbers
      // We don't have timestamps, so use startBlock > 0 as a proxy for "started"
      const isActive = startBlock > BigInt(0);
      const hasEnded = false; // We can't determine this without current block; will be overridden by detail page

      return {
        ccaAddress,
        token,
        currency,
        startBlock,
        endBlock,
        clearingPrice,
        currencyRaised,
        isActive,
        hasEnded,
      };
    });
  }, [addresses, ccaResults]);

  // Step 3: Fetch ERC20 metadata for token + currency
  const META_FIELDS = 3;
  const uniqueAddresses = useMemo(() => {
    const set = new Set<Address>();
    for (const a of baseAuctions) {
      if (a.token && a.token !== ZERO_ADDRESS) set.add(a.token);
      if (a.currency && a.currency !== ZERO_ADDRESS) set.add(a.currency);
    }
    return Array.from(set);
  }, [baseAuctions]);

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

  // Step 4: Build AuctionEntry[]
  const auctions: AuctionEntry[] = useMemo(() => {
    return baseAuctions.map((a) => {
      const tokenMeta = metaMap.get(a.token);
      const currencyMeta = metaMap.get(a.currency);
      return {
        ccaAddress: a.ccaAddress,
        orchestratorAddress: ZERO_ADDRESS as Address,
        token: a.token,
        launchId: BigInt(0),
        launchState: LaunchState.AUCTION_ACTIVE,
        startTime: BigInt(0), // Block-based, not timestamp
        endTime: BigInt(0),
        currentPrice: a.clearingPrice,
        tokensSold: BigInt(0),
        totalRaised: a.currencyRaised,
        isActive: a.isActive,
        hasEnded: a.hasEnded,
        tokenSymbol: tokenMeta?.symbol,
        tokenName: tokenMeta?.name,
        tokenDecimals: tokenMeta?.decimals,
        currencySymbol: currencyMeta?.symbol,
        currencyDecimals: currencyMeta?.decimals,
      };
    });
  }, [baseAuctions, metaMap]);

  const isLoading = isLoadingCCA || isLoadingMeta;

  return { auctions, isLoading, chainId };
}
