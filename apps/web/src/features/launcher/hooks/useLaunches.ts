"use client";

import { useReadContracts, useChainId } from "wagmi";
import { launchFactoryAbi, launchOrchestratorAbi, getFactoryAddress, type LaunchState } from "@launcher/sdk";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { useMemo } from "react";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface LaunchEntry {
  address: Address;
  launchId: number;
  operator: Address;
  state: LaunchState;
  token: Address;
  paymentToken: Address;
  auctionTokenAmount: bigint;
  liquidityTokenAmount: bigint;
  auctionStartBlock: bigint;
  auctionEndBlock: bigint;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
}

export function useLaunches(overrideChainId?: number) {
  const connectedChainId = useChainId();
  const chainId = overrideChainId ?? connectedChainId;
  const factoryAddress = getFactoryAddress(chainId) as Address | undefined;

  // Step 1: Get launch count
  const { data: countResult } = useReadContracts({
    contracts: factoryAddress
      ? [{ address: factoryAddress, abi: launchFactoryAbi, functionName: "launchCount", chainId }]
      : [],
    query: { enabled: !!factoryAddress },
  });

  const launchCount = countResult?.[0]?.result as bigint | undefined;

  // Step 2: Get all launch addresses
  const addressCalls = useMemo(() => {
    if (!factoryAddress || !launchCount) return [];
    return Array.from({ length: Number(launchCount) }, (_, i) => ({
      address: factoryAddress,
      abi: launchFactoryAbi,
      functionName: "getLaunch" as const,
      args: [BigInt(i)] as const,
      chainId,
    }));
  }, [factoryAddress, launchCount, chainId]);

  const { data: addressResults } = useReadContracts({
    contracts: addressCalls,
    query: { enabled: addressCalls.length > 0 },
  });

  const launchAddresses = useMemo(
    () => (addressResults?.map((r) => r.result as Address).filter(Boolean) ?? []),
    [addressResults],
  );

  // Step 3: Get summary data for each launch (orchestrator fields)
  const summaryCalls = useMemo(() => {
    return launchAddresses.flatMap((addr) => [
      { address: addr, abi: launchOrchestratorAbi, functionName: "operator" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "getState" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "token" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "paymentToken" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "auctionTokenAmount" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "liquidityTokenAmount" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "auctionStartBlock" as const, chainId },
      { address: addr, abi: launchOrchestratorAbi, functionName: "auctionEndBlockConfig" as const, chainId },
    ]);
  }, [launchAddresses, chainId]);

  const { data: summaryResults, isLoading: summaryLoading, error, refetch } = useReadContracts({
    contracts: summaryCalls,
    query: { enabled: summaryCalls.length > 0, staleTime: 120_000 },
  });

  // Parse summary results to get token addresses
  const parsedSummary = useMemo(() => {
    if (!summaryResults || launchAddresses.length === 0) return [];
    const fieldsPerLaunch = 8;
    return launchAddresses.map((addr, i) => {
      const offset = i * fieldsPerLaunch;
      return {
        address: addr,
        launchId: i,
        operator: summaryResults[offset]?.result as Address,
        state: summaryResults[offset + 1]?.result as LaunchState,
        token: summaryResults[offset + 2]?.result as Address,
        paymentToken: summaryResults[offset + 3]?.result as Address,
        auctionTokenAmount: (summaryResults[offset + 4]?.result as bigint) ?? BigInt(0),
        liquidityTokenAmount: (summaryResults[offset + 5]?.result as bigint) ?? BigInt(0),
        auctionStartBlock: (summaryResults[offset + 6]?.result as bigint) ?? BigInt(0),
        auctionEndBlock: (summaryResults[offset + 7]?.result as bigint) ?? BigInt(0),
      };
    });
  }, [summaryResults, launchAddresses]);

  // Step 4: Get ERC20 metadata (name, symbol, decimals) for each token
  const tokenMetaCalls = useMemo(() => {
    return parsedSummary.flatMap((entry) => {
      const tokenAddr = entry.token;
      if (!tokenAddr || tokenAddr === ZERO_ADDRESS) {
        // Return dummy calls that will fail gracefully
        return [
          { address: ZERO_ADDRESS as Address, abi: erc20Abi, functionName: "name" as const, chainId },
          { address: ZERO_ADDRESS as Address, abi: erc20Abi, functionName: "symbol" as const, chainId },
          { address: ZERO_ADDRESS as Address, abi: erc20Abi, functionName: "decimals" as const, chainId },
        ];
      }
      return [
        { address: tokenAddr, abi: erc20Abi, functionName: "name" as const, chainId },
        { address: tokenAddr, abi: erc20Abi, functionName: "symbol" as const, chainId },
        { address: tokenAddr, abi: erc20Abi, functionName: "decimals" as const, chainId },
      ];
    });
  }, [parsedSummary, chainId]);

  const { data: tokenMetaResults, isLoading: metaLoading } = useReadContracts({
    contracts: tokenMetaCalls,
    query: { enabled: tokenMetaCalls.length > 0 },
  });

  const launches: LaunchEntry[] = useMemo(() => {
    return parsedSummary.map((entry, i) => {
      const metaOffset = i * 3;
      const tokenName = tokenMetaResults?.[metaOffset]?.result as string | undefined;
      const tokenSymbol = tokenMetaResults?.[metaOffset + 1]?.result as string | undefined;
      const tokenDecimals = tokenMetaResults?.[metaOffset + 2]?.result as number | undefined;
      return {
        ...entry,
        tokenName: tokenName ?? "—",
        tokenSymbol: tokenSymbol ?? "—",
        tokenDecimals: tokenDecimals ?? 18,
      };
    });
  }, [parsedSummary, tokenMetaResults]);

  const isLoading = summaryLoading || metaLoading;

  return { launches, launchCount, factoryAddress, isLoading, error, refetch };
}
