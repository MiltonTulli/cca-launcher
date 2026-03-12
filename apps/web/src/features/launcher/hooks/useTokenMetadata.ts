"use client";

import { useReadContracts, useChainId } from "wagmi";
import { erc20Abi } from "viem";
import type { Address } from "viem";
import { useMemo } from "react";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface TokenMetadata {
  symbol: string | undefined;
  decimals: number | undefined;
  name: string | undefined;
}

/**
 * Fetches ERC20 metadata (symbol, decimals, name) for a token address.
 * Returns undefined values if address is zero or not set.
 */
export function useTokenMetadata(
  tokenAddress?: Address,
  overrideChainId?: number,
): TokenMetadata & { isLoading: boolean } {
  const connectedChainId = useChainId();
  const chainId = overrideChainId ?? connectedChainId;

  const isValid = !!tokenAddress && tokenAddress !== ZERO_ADDRESS;

  const contracts = useMemo(() => {
    if (!isValid) return [];
    return [
      { address: tokenAddress, abi: erc20Abi, functionName: "symbol" as const, chainId },
      { address: tokenAddress, abi: erc20Abi, functionName: "decimals" as const, chainId },
      { address: tokenAddress, abi: erc20Abi, functionName: "name" as const, chainId },
    ];
  }, [tokenAddress, isValid, chainId]);

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: isValid },
  });

  return {
    symbol: data?.[0]?.result as string | undefined,
    decimals: data?.[1]?.result as number | undefined,
    name: data?.[2]?.result as string | undefined,
    isLoading,
  };
}
