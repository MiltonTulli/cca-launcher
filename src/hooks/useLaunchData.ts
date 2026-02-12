"use client";

import { useMemo, useCallback } from "react";
import { Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import {
  TALLY_LAUNCH_ORCHESTRATOR_ABI,
  CCA_AUCTION_ABI,
  ERC20_ABI,
  ACCESS_CONTROL_ABI,
  MINTER_ROLE,
  LaunchState,
} from "@/config/contracts";
import { ZERO_ADDRESS, EXPLORER_URLS } from "@/lib/utils";
import { useResolvedChainId } from "./useResolvedChainId";
import type {
  LaunchInfo,
  DistributionInfo,
  AuctionInfo,
} from "@/components/launch-detail/types";

export interface UseLaunchDataReturn {
  // Loading / error
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;

  // Primary data
  launchInfo: LaunchInfo | undefined;
  distInfo: DistributionInfo | undefined;
  auctionInfo: AuctionInfo | undefined;
  isPermissionless: boolean | undefined;
  unlocked: boolean | undefined;
  pendingOp: Address | undefined;
  currentState: LaunchState;
  tokenSourceValue: number | undefined;
  tokenAmountValue: bigint | undefined;
  auctionEndTimeValue: bigint | undefined;
  distributionDelayValue: bigint | undefined;
  distributionTimestampValue: bigint | undefined;

  // Derived
  isOperator: boolean;
  isPendingOperator: boolean;
  auctionTimeElapsed: boolean;

  // Token data
  orchestratorTokenBalance: bigint | undefined;
  operatorTokenAllowance: bigint | undefined;
  hasMinterRole: boolean | undefined;
  operatorTokenBalance: bigint | undefined;
  tokenLoading: boolean;

  // CCA supplemental data (read directly from CCA contract)
  ccaAddress: Address | undefined;
  ccaCurrencyRaised: bigint | undefined;
  ccaIsGraduated: boolean | undefined;

  // Wallet / chain
  connectedAddress: Address | undefined;
  chainId: number;
  explorerUrl: string;
}

export function useLaunchData(address: Address, overrideChainId?: number): UseLaunchDataReturn {
  const { address: connectedAddress } = useAccount();
  const chainId = useResolvedChainId(overrideChainId);
  const explorerUrl = EXPLORER_URLS[chainId] || "https://etherscan.io";

  // ============================================
  // Primary Multicall: orchestrator data
  // ============================================
  const contractBase = { address, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI, chainId } as const;

  const {
    data: results,
    isLoading,
    isError,
    refetch: rawRefetch,
  } = useReadContracts({
    contracts: [
      { ...contractBase, functionName: "getLaunchInfo" },               // [0]
      { ...contractBase, functionName: "getDistributionState" },        // [1]
      { ...contractBase, functionName: "getAuctionInfo" },              // [2]
      { ...contractBase, functionName: "isDistributionPermissionless" },// [3]
      { ...contractBase, functionName: "isUnlocked" },                  // [4]
      { ...contractBase, functionName: "pendingOperator" },             // [5]
      { ...contractBase, functionName: "state" },                       // [6]
      { ...contractBase, functionName: "tokenSource" },                 // [7]
      { ...contractBase, functionName: "tokenAmount" },                 // [8]
      { ...contractBase, functionName: "auctionEndTime" },              // [9]
      { ...contractBase, functionName: "distributionDelay" },           // [10]
      { ...contractBase, functionName: "distributionTimestamp" },        // [11]
    ],
    query: {
      refetchInterval: 15000,
    },
  });

  const refetch = useCallback(() => {
    rawRefetch();
  }, [rawRefetch]);

  // Parse primary results
  const launchInfo = results?.[0]?.result as LaunchInfo | undefined;
  const distInfo = results?.[1]?.result as DistributionInfo | undefined;
  const auctionInfo = results?.[2]?.result as AuctionInfo | undefined;
  const isPermissionless = results?.[3]?.result as boolean | undefined;
  const unlocked = results?.[4]?.result as boolean | undefined;
  const pendingOp = results?.[5]?.result as Address | undefined;
  const directState = results?.[6]?.result as number | undefined;
  const tokenSourceValue = results?.[7]?.result as number | undefined;
  const tokenAmountValue = results?.[8]?.result as bigint | undefined;
  const auctionEndTimeValue = results?.[9]?.result as bigint | undefined;
  const distributionDelayValue = results?.[10]?.result as bigint | undefined;
  const distributionTimestampValue = results?.[11]?.result as bigint | undefined;

  // Derived values
  const currentState = (directState ?? launchInfo?.state ?? 0) as LaunchState;
  const isOperator =
    !!connectedAddress &&
    !!launchInfo?.operator &&
    connectedAddress.toLowerCase() === launchInfo.operator.toLowerCase();
  const isPendingOperator =
    !!connectedAddress &&
    !!pendingOp &&
    pendingOp !== ZERO_ADDRESS &&
    connectedAddress.toLowerCase() === pendingOp.toLowerCase();

  // ============================================
  // Secondary Multicall: token balance/allowance/role
  // ============================================
  const tokenAddress = launchInfo?.token;
  const operatorAddress = launchInfo?.operator;

  const tokenContracts = useMemo(() => {
    if (!tokenAddress || !operatorAddress) return [];
    const contracts: {
      address: Address;
      abi: typeof ERC20_ABI | typeof ACCESS_CONTROL_ABI;
      functionName: string;
      args: readonly unknown[];
      chainId: number;
    }[] = [
      // [0] Token balance of orchestrator
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
        chainId,
      },
      // [1] Token allowance from operator to orchestrator
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [operatorAddress, address],
        chainId,
      },
      // [2] hasRole(MINTER_ROLE, orchestrator) — may fail if token doesn't implement AccessControl
      {
        address: tokenAddress,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [MINTER_ROLE, address],
        chainId,
      },
      // [3] Token balance of operator (for TRANSFER_FROM check in startAuction)
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [operatorAddress],
        chainId,
      },
    ];
    return contracts;
  }, [tokenAddress, operatorAddress, address]);

  const { data: tokenResults, isLoading: tokenLoading } = useReadContracts({
    contracts: tokenContracts as never,
    query: {
      enabled: tokenContracts.length > 0,
      refetchInterval: 15000,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tr = tokenResults as any[] | undefined;
  const orchestratorTokenBalance = tr?.[0]?.result as bigint | undefined;
  const operatorTokenAllowance = tr?.[1]?.result as bigint | undefined;
  const hasMinterRole = tr?.[2]?.status === "success"
    ? (tr[2].result as boolean)
    : undefined;
  const operatorTokenBalance = tr?.[3]?.result as bigint | undefined;

  // ============================================
  // CCA Supplemental: read currencyRaised directly from CCA
  // ============================================
  const ccaAddress = auctionInfo?.cca;
  const hasCCA = !!ccaAddress && ccaAddress !== ZERO_ADDRESS;

  const { data: ccaResults } = useReadContracts({
    contracts: hasCCA
      ? [
          { address: ccaAddress!, abi: CCA_AUCTION_ABI, functionName: "currencyRaised" as const, chainId },
          { address: ccaAddress!, abi: CCA_AUCTION_ABI, functionName: "isGraduated" as const, chainId },
        ]
      : [],
    query: { enabled: hasCCA, refetchInterval: 15000 },
  });

  const ccaCurrencyRaised = ccaResults?.[0]?.result as bigint | undefined;
  const ccaIsGraduated = ccaResults?.[1]?.result as boolean | undefined;

  // auctionTimeElapsed needs `now` but we compute it here based on current time
  // so the hook is self-contained. The parent can also pass `now` via the
  // preconditions hook for countdown logic.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const auctionTimeElapsed =
    currentState === LaunchState.AUCTION_ACTIVE &&
    auctionEndTimeValue !== undefined &&
    Number(auctionEndTimeValue) > 0 &&
    nowSeconds >= Number(auctionEndTimeValue);

  return {
    isLoading,
    isError,
    refetch,

    launchInfo,
    distInfo,
    auctionInfo,
    isPermissionless,
    unlocked,
    pendingOp,
    currentState,
    tokenSourceValue,
    tokenAmountValue,
    auctionEndTimeValue,
    distributionDelayValue,
    distributionTimestampValue,
    isOperator,
    isPendingOperator,
    auctionTimeElapsed,

    orchestratorTokenBalance,
    operatorTokenAllowance,
    hasMinterRole,
    operatorTokenBalance,
    tokenLoading,

    ccaAddress: hasCCA ? ccaAddress! : undefined,
    ccaCurrencyRaised,
    ccaIsGraduated,

    connectedAddress,
    chainId,
    explorerUrl,
  };
}
