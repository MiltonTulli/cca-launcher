"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { launchOrchestratorAbi } from "@launcher/sdk";
import type { Address } from "viem";

export function useSettleAuction(launchAddress?: Address, chainId?: number) {
  const { writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const settleAuction = async () => {
    if (!launchAddress) throw new Error("No launch address");
    return writeContractAsync({
      address: launchAddress,
      abi: launchOrchestratorAbi,
      functionName: "settleAuction",
      chainId,
    });
  };

  return { settleAuction, hash, isPending, isConfirming, isSuccess, error, reset };
}
