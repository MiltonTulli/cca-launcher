"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { useReadContracts } from "wagmi";
import {
  CCA_AUCTION_ABI,
  ERC20_EXTENDED_ABI,
  LaunchState,
  STANDALONE_CCA_ADDRESSES,
} from "@/config/contracts";
import type { AuctionEntry } from "@/config/types";
import { ZERO_ADDRESS } from "@/lib/utils";

/** Flat entry: address + its chain */
interface StandaloneAddr {
  address: Address;
  chainId: number;
}

/**
 * Fetches auction data for ALL standalone CCA contracts across every chain
 * listed in STANDALONE_CCA_ADDRESSES, plus any extra addresses passed in.
 */
export function useStandaloneAuctions(extraAddresses?: { address: Address; chainId: number }[]) {
  // Flatten all chain → address[] entries into a single array with chainId
  const allAddresses: StandaloneAddr[] = useMemo(() => {
    const result: StandaloneAddr[] = [];
    const seen = new Set<string>();
    for (const [cid, addrs] of Object.entries(STANDALONE_CCA_ADDRESSES)) {
      for (const addr of addrs) {
        const key = `${cid}:${addr.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ address: addr, chainId: Number(cid) });
        }
      }
    }
    if (extraAddresses) {
      for (const entry of extraAddresses) {
        const key = `${entry.chainId}:${entry.address.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(entry);
        }
      }
    }
    return result;
  }, [extraAddresses]);

  // Step 1: Read core CCA fields for each standalone address
  const FIELDS_PER_CCA = 7;
  const ccaContracts = useMemo(() => {
    if (allAddresses.length === 0) return [];
    return allAddresses.flatMap(({ address: addr, chainId }) => [
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "token" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "currency" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "totalSupply" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "startBlock" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "endBlock" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "clearingPrice" as const, chainId },
      { address: addr, abi: CCA_AUCTION_ABI, functionName: "currencyRaised" as const, chainId },
    ]);
  }, [allAddresses]);

  const { data: ccaResults, isLoading: isLoadingCCA } = useReadContracts({
    contracts: ccaContracts,
    query: { enabled: ccaContracts.length > 0, staleTime: 120_000 },
  });

  // Step 2: Parse base auction data
  const baseAuctions = useMemo(() => {
    if (allAddresses.length === 0 || !ccaResults) return [];

    return allAddresses.map(({ address: ccaAddress, chainId }, i) => {
      const base = i * FIELDS_PER_CCA;
      const token = (ccaResults[base]?.result as Address | undefined) ?? (ZERO_ADDRESS as Address);
      const currency =
        (ccaResults[base + 1]?.result as Address | undefined) ?? (ZERO_ADDRESS as Address);
      const startBlock = (ccaResults[base + 3]?.result as bigint | undefined) ?? BigInt(0);
      const endBlock = (ccaResults[base + 4]?.result as bigint | undefined) ?? BigInt(0);
      const clearingPrice = (ccaResults[base + 5]?.result as bigint | undefined) ?? BigInt(0);
      const currencyRaised = (ccaResults[base + 6]?.result as bigint | undefined) ?? BigInt(0);

      const isActive = startBlock > BigInt(0);
      const hasEnded = false;

      return {
        ccaAddress,
        chainId,
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
  }, [allAddresses, ccaResults]);

  // Step 3: Fetch ERC20 metadata for token + currency (with per-address chainId)
  const META_FIELDS = 3;
  const uniqueTokenEntries = useMemo(() => {
    const seen = new Set<string>();
    const entries: { address: Address; chainId: number }[] = [];
    for (const a of baseAuctions) {
      const tKey = `${a.chainId}:${a.token}`;
      if (a.token !== ZERO_ADDRESS && !seen.has(tKey)) {
        seen.add(tKey);
        entries.push({ address: a.token, chainId: a.chainId });
      }
      const cKey = `${a.chainId}:${a.currency}`;
      if (a.currency !== ZERO_ADDRESS && !seen.has(cKey)) {
        seen.add(cKey);
        entries.push({ address: a.currency, chainId: a.chainId });
      }
    }
    return entries;
  }, [baseAuctions]);

  const metaContracts = useMemo(() => {
    if (uniqueTokenEntries.length === 0) return [];
    return uniqueTokenEntries.flatMap(({ address: addr, chainId }) => [
      { address: addr, abi: ERC20_EXTENDED_ABI, functionName: "symbol" as const, chainId },
      { address: addr, abi: ERC20_EXTENDED_ABI, functionName: "name" as const, chainId },
      { address: addr, abi: ERC20_EXTENDED_ABI, functionName: "decimals" as const, chainId },
    ]);
  }, [uniqueTokenEntries]);

  const { data: metaResults, isLoading: isLoadingMeta } = useReadContracts({
    contracts: metaContracts,
    query: { enabled: metaContracts.length > 0, staleTime: 300_000 },
  });

  const metaMap = useMemo(() => {
    const map = new Map<string, { symbol?: string; name?: string; decimals?: number }>();
    if (!metaResults) return map;
    for (let i = 0; i < uniqueTokenEntries.length; i++) {
      const base = i * META_FIELDS;
      const key = `${uniqueTokenEntries[i].chainId}:${uniqueTokenEntries[i].address}`;
      map.set(key, {
        symbol: metaResults[base]?.result as string | undefined,
        name: metaResults[base + 1]?.result as string | undefined,
        decimals: metaResults[base + 2]?.result as number | undefined,
      });
    }
    return map;
  }, [uniqueTokenEntries, metaResults]);

  // Step 4: Build AuctionEntry[]
  const auctions: AuctionEntry[] = useMemo(() => {
    return baseAuctions.map((a) => {
      const tokenMeta = metaMap.get(`${a.chainId}:${a.token}`);
      const currencyMeta = metaMap.get(`${a.chainId}:${a.currency}`);
      return {
        ccaAddress: a.ccaAddress,
        orchestratorAddress: ZERO_ADDRESS as Address,
        token: a.token,
        launchId: BigInt(0),
        launchState: LaunchState.AUCTION_ACTIVE,
        chainId: a.chainId,
        startTime: BigInt(0),
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
        paymentToken: a.currency,
      };
    });
  }, [baseAuctions, metaMap]);

  const isLoading = isLoadingCCA || isLoadingMeta;

  return { auctions, isLoading };
}
