"use client";

import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { launchFactoryAbi, getFactoryAddress } from "@launcher/sdk";
import type { LaunchParams } from "@launcher/sdk";
import type { Address } from "viem";
import { parseEventLogs } from "viem";
import { useMemo } from "react";

export function useCreateLaunch(overrideChainId?: number) {
  const connectedChainId = useChainId();
  const chainId = overrideChainId ?? connectedChainId;
  const factoryAddress = getFactoryAddress(chainId) as Address | undefined;

  const { writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const launchCreatedEvent = useMemo(() => {
    if (!receipt) return undefined;
    const logs = parseEventLogs({
      abi: launchFactoryAbi,
      logs: receipt.logs,
      eventName: "LaunchCreated",
    });
    return logs[0]?.args;
  }, [receipt]);

  const createLaunch = async (params: LaunchParams) => {
    if (!factoryAddress) throw new Error("Factory not deployed on this chain");
    return writeContractAsync({
      address: factoryAddress,
      abi: launchFactoryAbi,
      functionName: "createLaunch",
      args: [params],
      chainId,
    });
  };

  return {
    createLaunch,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
    launchAddress: launchCreatedEvent?.launch as Address | undefined,
    launchId: launchCreatedEvent?.launchId as bigint | undefined,
  };
}
