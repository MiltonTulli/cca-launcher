"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { useBlockNumber, useReadContracts } from "wagmi";
import {
  launchFactoryAbi,
  launchOrchestratorAbi,
  getFactoryAddress,
  LaunchState,
} from "@launcher/sdk";
import { CCA_AUCTION_ABI } from "@/config/contracts";
import type { AuctionEntry } from "@/config/types";
import { ZERO_ADDRESS } from "@/lib/utils";
import { useResolvedChainId } from "./useResolvedChainId";

/**
 * Fetches all CCA auctions by scanning launches from the new LaunchFactory
 * and filtering those with state >= FINALIZED and a non-zero CCA address.
 *
 * Uses the new contract architecture with individual getters on LaunchOrchestrator.
 */
export function useAuctions(overrideChainId?: number) {
  const chainId = useResolvedChainId(overrideChainId);
  const factoryAddress = getFactoryAddress(chainId) as Address | undefined;
  const enabled = !!factoryAddress;

  const { data: blockNumber } = useBlockNumber({ chainId, query: { staleTime: 300_000 } });

  // Step 1: Get launch count
  const {
    data: countResult,
    isLoading: isLoadingCount,
    refetch,
  } = useReadContracts({
    contracts: factoryAddress
      ? [{ address: factoryAddress, abi: launchFactoryAbi, functionName: "launchCount", chainId }]
      : [],
    query: { enabled, staleTime: 120_000 },
  });

  const launchCount = countResult?.[0]?.result as bigint | undefined;
  const count = typeof launchCount === "bigint" ? Number(launchCount) : 0;

  // Step 2: Get all orchestrator addresses
  const addressContracts = useMemo(() => {
    if (count === 0 || !factoryAddress) return [];
    return Array.from({ length: count }, (_, i) => ({
      address: factoryAddress,
      abi: launchFactoryAbi,
      functionName: "getLaunch" as const,
      args: [BigInt(i)] as const,
      chainId,
    }));
  }, [count, factoryAddress, chainId]);

  const { data: addressResults, isLoading: isLoadingAddresses } = useReadContracts({
    contracts: addressContracts,
    query: { enabled: addressContracts.length > 0, staleTime: 120_000 },
  });

  const launchAddresses = useMemo(() => {
    if (!addressResults) return [];
    return addressResults
      .map((r) => r.result as Address | undefined)
      .filter((addr): addr is Address => !!addr && addr !== ZERO_ADDRESS);
  }, [addressResults]);

  // Step 3: Get state, token, launchId, cca, timing, and auction data per orchestrator
  const FIELDS_PER_LAUNCH = 9;
  const detailContracts = useMemo(() => {
    if (launchAddresses.length === 0) return [];
    return launchAddresses.flatMap((addr) => [
      { address: addr, abi: launchOrchestratorAbi, functionName: "getState" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "token" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "launchId" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "cca" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "auctionStartBlock" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "auctionEndBlock" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "totalRaised" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "tokensSold" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "paymentToken" as const, chainId },
    ]);
  }, [launchAddresses, chainId]);

  const { data: detailResults, isLoading: isLoadingDetails } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: detailContracts.length > 0, staleTime: 120_000 },
  });

  // Step 4: Parse and filter — only include launches with CCA (state >= FINALIZED)
  const baseAuctions = useMemo(() => {
    if (launchAddresses.length === 0 || !detailResults) return [];

    const result: {
      ccaAddress: Address;
      orchestratorAddress: Address;
      token: Address;
      paymentToken: Address;
      launchId: bigint;
      launchState: number;
      startBlock: bigint;
      endBlock: bigint;
      totalRaised: bigint;
      tokensSold: bigint;
      isActive: boolean;
      hasEnded: boolean;
    }[] = [];

    for (let i = 0; i < launchAddresses.length; i++) {
      const base = i * FIELDS_PER_LAUNCH;
      const state = (detailResults[base]?.result as number | undefined) ?? 0;
      const token = detailResults[base + 1]?.result as Address | undefined;
      const launchId = detailResults[base + 2]?.result as bigint | undefined;
      const ccaAddress = detailResults[base + 3]?.result as Address | undefined;
      const startBlock = (detailResults[base + 4]?.result as bigint | undefined) ?? BigInt(0);
      const endBlock = (detailResults[base + 5]?.result as bigint | undefined) ?? BigInt(0);
      const totalRaised = (detailResults[base + 6]?.result as bigint | undefined) ?? BigInt(0);
      const tokensSold = (detailResults[base + 7]?.result as bigint | undefined) ?? BigInt(0);
      const paymentToken = detailResults[base + 8]?.result as Address | undefined;

      // Only include if FINALIZED or later and has a CCA
      if (state < LaunchState.FINALIZED) continue;
      if (!ccaAddress || ccaAddress === ZERO_ADDRESS) continue;

      // Derive auction active/ended from block numbers
      const currentBlock = blockNumber ?? BigInt(0);
      const isActive = currentBlock >= startBlock && currentBlock < endBlock && startBlock > BigInt(0);
      const hasEnded = currentBlock >= endBlock && endBlock > BigInt(0);

      result.push({
        ccaAddress,
        orchestratorAddress: launchAddresses[i],
        token: token ?? (ZERO_ADDRESS as Address),
        paymentToken: paymentToken ?? (ZERO_ADDRESS as Address),
        launchId: launchId ?? BigInt(0),
        launchState: state,
        startBlock,
        endBlock,
        totalRaised,
        tokensSold,
        isActive,
        hasEnded,
      });
    }
    return result;
  }, [launchAddresses, detailResults, blockNumber]);

  // Step 5: Fetch clearing price from each CCA contract
  const ccaContracts = useMemo(() => {
    if (baseAuctions.length === 0) return [];
    return baseAuctions.map((a) => ({
      address: a.ccaAddress,
      abi: CCA_AUCTION_ABI,
      functionName: "clearingPrice" as const,
      chainId,
    }));
  }, [baseAuctions, chainId]);

  const { data: ccaResults, isLoading: isLoadingCCA } = useReadContracts({
    contracts: ccaContracts,
    query: { enabled: ccaContracts.length > 0, staleTime: 120_000 },
  });

  // Step 6: Fetch ERC20 metadata for token + paymentToken
  const META_FIELDS = 3;
  const uniqueAddresses = useMemo(() => {
    const set = new Set<Address>();
    for (const a of baseAuctions) {
      if (a.token && a.token !== ZERO_ADDRESS) set.add(a.token);
      if (a.paymentToken && a.paymentToken !== ZERO_ADDRESS) set.add(a.paymentToken);
    }
    return Array.from(set);
  }, [baseAuctions]);

  const metaContracts = useMemo(() => {
    if (uniqueAddresses.length === 0) return [];
    return uniqueAddresses.flatMap((addr) => [
      { address: addr, abi: erc20Abi, functionName: "symbol" as const, chainId },
      { address: addr, abi: erc20Abi, functionName: "name" as const, chainId },
      { address: addr, abi: erc20Abi, functionName: "decimals" as const, chainId },
    ]);
  }, [uniqueAddresses, chainId]);

  const { data: metaResults, isLoading: isLoadingMeta } = useReadContracts({
    contracts: metaContracts,
    query: { enabled: metaContracts.length > 0, staleTime: 300_000 },
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
    return baseAuctions.map((a, i) => {
      const tokenMeta = metaMap.get(a.token);
      const currencyMeta = a.paymentToken !== ZERO_ADDRESS ? metaMap.get(a.paymentToken) : undefined;
      const clearingPrice = (ccaResults?.[i]?.result as bigint | undefined) ?? BigInt(0);

      return {
        ccaAddress: a.ccaAddress,
        orchestratorAddress: a.orchestratorAddress,
        token: a.token,
        launchId: a.launchId,
        launchState: a.launchState,
        chainId,
        startTime: BigInt(0), // Not used in new contracts (block-based)
        endTime: BigInt(0),
        currentPrice: clearingPrice,
        tokensSold: a.tokensSold,
        totalRaised: a.totalRaised,
        isActive: a.isActive,
        hasEnded: a.hasEnded,
        tokenSymbol: tokenMeta?.symbol,
        tokenName: tokenMeta?.name,
        tokenDecimals: tokenMeta?.decimals,
        currencySymbol: currencyMeta?.symbol,
        currencyDecimals: currencyMeta?.decimals,
        paymentToken: a.paymentToken,
      };
    });
  }, [baseAuctions, metaMap, ccaResults, chainId]);

  const isLoading =
    isLoadingCount || isLoadingAddresses || isLoadingDetails || isLoadingCCA || isLoadingMeta;

  return { auctions, isLoading, refetch, chainId };
}
