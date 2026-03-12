"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { launchOrchestratorAbi } from "@launcher/sdk";
import type { Address } from "viem";

export function useProcessDistribution(launchAddress?: Address, chainId?: number) {
  const { writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const processDistribution = async () => {
    if (!launchAddress) throw new Error("No launch address");
    return writeContractAsync({
      address: launchAddress,
      abi: launchOrchestratorAbi,
      functionName: "processDistribution",
      chainId,
    });
  };

  return { processDistribution, hash, isPending, isConfirming, isSuccess, error, reset };
}
