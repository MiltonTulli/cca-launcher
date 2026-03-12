"use client";

import { useAccount, useChainId, useReadContract } from "wagmi";
import { launchFactoryAbi, getFactoryAddress } from "@launcher/sdk";
import type { Address } from "viem";

/**
 * Lightweight hook that checks if the connected wallet has any launches.
 * Returns { hasLaunches, isLoading }.
 */
export function useHasLaunches() {
  const { address } = useAccount();
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId) as Address | undefined;

  const { data, isLoading } = useReadContract({
    address: factoryAddress,
    abi: launchFactoryAbi,
    functionName: "getLaunchesByOperator",
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!factoryAddress && !!address,
      staleTime: 60_000,
    },
  });

  const launchIds = data as bigint[] | undefined;
  const hasLaunches = (launchIds?.length ?? 0) > 0;

  return { hasLaunches, isLoading };
}
