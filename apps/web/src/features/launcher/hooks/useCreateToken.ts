"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from "wagmi";
import { launchOrchestratorAbi, launchFactoryAbi, getFactoryAddress } from "@launcher/sdk";
import type { TokenCreationParams } from "@launcher/sdk";
import type { Address } from "viem";

export function useCreateToken(launchAddress?: Address, overrideChainId?: number) {
  const connectedChainId = useChainId();
  const chainId = overrideChainId ?? connectedChainId;
  const factoryAddress = getFactoryAddress(chainId) as Address | undefined;

  // Read token creation fee from factory
  const { data: feeConfig } = useReadContract({
    address: factoryAddress,
    abi: launchFactoryAbi,
    functionName: "feeConfig",
    chainId,
    query: { enabled: !!factoryAddress },
  });

  // feeConfig returns a tuple: viem may return it as an object or array
  const tokenCreationFee = (() => {
    if (!feeConfig) return undefined;
    // Object with named props
    if (typeof feeConfig === "object" && "tokenCreationFee" in (feeConfig as any)) {
      return (feeConfig as any).tokenCreationFee as bigint;
    }
    // Array: [feeRecipient, saleFeeBps, lpFeeShareBps, tokenCreationFee]
    if (Array.isArray(feeConfig) && feeConfig.length >= 4) {
      return feeConfig[3] as bigint;
    }
    return BigInt(0);
  })();

  const { writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createToken = async (params: TokenCreationParams) => {
    if (!launchAddress) throw new Error("No launch address");
    return writeContractAsync({
      address: launchAddress,
      abi: launchOrchestratorAbi,
      functionName: "createToken",
      args: [params],
      value: tokenCreationFee ?? BigInt(0),
      chainId,
    });
  };

  return {
    createToken,
    tokenCreationFee,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
