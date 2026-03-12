"use client";

import { useReadContract, useReadContracts, useChainId } from "wagmi";
import { launchFactoryAbi, getFactoryAddress } from "@launcher/sdk";
import type { Address } from "viem";

export function useLaunchFactory(overrideChainId?: number) {
  const connectedChainId = useChainId();
  const chainId = overrideChainId ?? connectedChainId;
  const factoryAddress = getFactoryAddress(chainId) as Address | undefined;

  const { data: launchCount, ...countQuery } = useReadContract({
    address: factoryAddress,
    abi: launchFactoryAbi,
    functionName: "launchCount",
    chainId,
    query: { enabled: !!factoryAddress },
  });

  return {
    factoryAddress,
    chainId,
    launchCount: launchCount as bigint | undefined,
    isLoading: countQuery.isLoading,
    error: countQuery.error,
    refetch: countQuery.refetch,
  };
}
