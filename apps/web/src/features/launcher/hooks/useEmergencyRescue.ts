"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { launchOrchestratorAbi } from "@launcher/sdk";
import type { Address } from "viem";

export function useEmergencyRescue(launchAddress?: Address, chainId?: number) {
  const { writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const emergencyRescue = async (tokenAddress: Address) => {
    if (!launchAddress) throw new Error("No launch address");
    return writeContractAsync({
      address: launchAddress,
      abi: launchOrchestratorAbi,
      functionName: "emergencyRescue",
      args: [tokenAddress],
      chainId,
    });
  };

  return { emergencyRescue, hash, isPending, isConfirming, isSuccess, error, reset };
}
