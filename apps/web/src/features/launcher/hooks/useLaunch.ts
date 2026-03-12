"use client";

import { useReadContracts, useChainId } from "wagmi";
import { launchOrchestratorAbi } from "@launcher/sdk";
import type { Address } from "viem";
import { useMemo } from "react";
import { fromLaunchData, type LaunchData } from "../utils/fromLaunchData";

// The order here MUST match fromLaunchData mapping
const ORCHESTRATOR_FUNCTIONS = [
  "operator",
  "getState",
  "token",
  "paymentToken",
  "launchId",
  "tokenSource",
  "auctionStartBlock",
  "auctionEndBlockConfig",
  "auctionEndBlock",
  "claimBlock",
  "auctionTickSpacing",
  "auctionTokenAmount",
  "liquidityTokenAmount",
  "reservePrice",
  "requiredCurrencyRaised",
  "validationHook",
  "cca",
  "treasuryAddress",
  "permissionlessDistributionDelay",
  "totalRaised",
  "tokensSold",
  "distributionTimestamp",
  "isDistributionPermissionless",
  "liquidityEnabled",
  "proceedsToLiquidityBps",
  "positionBeneficiary",
  "poolFee",
  "tickSpacing",
  "tickLower",
  "tickUpper",
  "lockupEnabled",
  "lockupDuration",
  "liquidityInfo",
  "pendingOperator",
  "metadataHash",
  "saleFeeBpsSnapshot",
  "lpFeeShareBps",
  "platformFeeRecipient",
] as const;

export function useLaunch(launchAddress?: Address, overrideChainId?: number) {
  const connectedChainId = useChainId();
  const chainId = overrideChainId ?? connectedChainId;

  const contracts = useMemo(() => {
    if (!launchAddress) return [];
    return ORCHESTRATOR_FUNCTIONS.map((fn) => ({
      address: launchAddress,
      abi: launchOrchestratorAbi,
      functionName: fn,
      chainId,
    }));
  }, [launchAddress, chainId]);

  const { data: results, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!launchAddress,
      refetchInterval: 15_000,
    },
  });

  const launchData: LaunchData | undefined = useMemo(() => {
    if (!results || results.some((r) => r.status === "failure")) return undefined;
    try {
      return fromLaunchData(results.map((r) => r.result));
    } catch {
      return undefined;
    }
  }, [results]);

  return { data: launchData, isLoading, error, refetch };
}
