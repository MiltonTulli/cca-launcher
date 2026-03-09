"use client";

import { useCallback, useMemo } from "react";
import type { Address } from "viem";
import { useAccount, useBlockNumber, useReadContracts } from "wagmi";
import {
  CCA_AUCTION_ABI,
  ERC20_EXTENDED_ABI,
  PERMIT2_ABI,
  PERMIT2_ADDRESS,
} from "@/config/contracts";
import { BidStatus, CCAPhase } from "@/config/enums";
import type { CCABidEntry, CCABidStruct } from "@/config/types";
import { getCCAPhase } from "@/lib/q96";
import { EXPLORER_URLS, ZERO_ADDRESS } from "@/lib/utils";
import { useResolvedChainId } from "./useResolvedChainId";

export interface UseCCADataReturn {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;

  // Static CCA params
  tokenAddress: Address | undefined;
  currencyAddress: Address | undefined;
  totalSupply: bigint | undefined;
  floorPrice: bigint | undefined;
  tickSpacing: bigint | undefined;
  startBlock: bigint | undefined;
  endBlock: bigint | undefined;
  claimBlock: bigint | undefined;
  maxBidPrice: bigint | undefined;
  fundsRecipient: Address | undefined;
  tokensRecipient: Address | undefined;
  validationHook: Address | undefined;

  // Dynamic state
  clearingPrice: bigint | undefined;
  currencyRaised: bigint | undefined;
  isGraduated: boolean | undefined;

  // Token metadata
  tokenSymbol: string | undefined;
  tokenDecimals: number | undefined;
  currencySymbol: string | undefined;
  currencyDecimals: number | undefined;

  // Phase / block
  phase: CCAPhase;
  currentBlock: bigint;

  // Bids (all bids, not just user's)
  allBids: CCABidEntry[];
  userCurrencyBalance: bigint | undefined;
  /** ERC20 allowance: currency → Permit2 contract */
  userErc20AllowanceForPermit2: bigint | undefined;
  /** Permit2 allowance: Permit2 → CCA contract (uint160) */
  userPermit2AllowanceForCCA: bigint | undefined;

  // Wallet / chain
  connectedAddress: Address | undefined;
  chainId: number;
  explorerUrl: string;
}

export function useCCAData(ccaAddress: Address, overrideChainId?: number): UseCCADataReturn {
  const { address: connectedAddress } = useAccount();
  const chainId = useResolvedChainId(overrideChainId);
  const explorerUrl = EXPLORER_URLS[chainId] || "https://etherscan.io";

  // Track current block
  const { data: currentBlockData } = useBlockNumber({ watch: true, chainId });
  const currentBlock = currentBlockData ?? BigInt(0);

  // ============================================
  // Primary Multicall: CCA static + dynamic params
  // ============================================
  const ccaBase = { address: ccaAddress, abi: CCA_AUCTION_ABI, chainId } as const;

  const {
    data: primaryResults,
    isLoading: isPrimaryLoading,
    isError,
    refetch: rawRefetch,
  } = useReadContracts({
    contracts: [
      { ...ccaBase, functionName: "token" }, // [0]
      { ...ccaBase, functionName: "currency" }, // [1]
      { ...ccaBase, functionName: "totalSupply" }, // [2]
      { ...ccaBase, functionName: "floorPrice" }, // [3]
      { ...ccaBase, functionName: "tickSpacing" }, // [4]
      { ...ccaBase, functionName: "startBlock" }, // [5]
      { ...ccaBase, functionName: "endBlock" }, // [6]
      { ...ccaBase, functionName: "claimBlock" }, // [7]
      { ...ccaBase, functionName: "MAX_BID_PRICE" }, // [8]
      { ...ccaBase, functionName: "fundsRecipient" }, // [9]
      { ...ccaBase, functionName: "tokensRecipient" }, // [10]
      { ...ccaBase, functionName: "validationHook" }, // [11]
      { ...ccaBase, functionName: "clearingPrice" }, // [12]
      { ...ccaBase, functionName: "currencyRaised" }, // [13]
      { ...ccaBase, functionName: "isGraduated" }, // [14]
      { ...ccaBase, functionName: "nextBidId" }, // [15]
    ],
    query: { refetchInterval: 15000 },
  });

  const refetch = useCallback(() => {
    rawRefetch();
  }, [rawRefetch]);

  // Parse primary results
  const tokenAddress = primaryResults?.[0]?.result as Address | undefined;
  const currencyAddress = primaryResults?.[1]?.result as Address | undefined;
  const totalSupply = primaryResults?.[2]?.result as bigint | undefined;
  const floorPrice = primaryResults?.[3]?.result as bigint | undefined;
  const tickSpacing = primaryResults?.[4]?.result as bigint | undefined;
  const startBlock = primaryResults?.[5]?.result as bigint | undefined;
  const endBlock = primaryResults?.[6]?.result as bigint | undefined;
  const claimBlock = primaryResults?.[7]?.result as bigint | undefined;
  const maxBidPrice = primaryResults?.[8]?.result as bigint | undefined;
  const fundsRecipient = primaryResults?.[9]?.result as Address | undefined;
  const tokensRecipient = primaryResults?.[10]?.result as Address | undefined;
  const validationHook = primaryResults?.[11]?.result as Address | undefined;
  const clearingPrice = primaryResults?.[12]?.result as bigint | undefined;
  const currencyRaised = primaryResults?.[13]?.result as bigint | undefined;
  const isGraduated = primaryResults?.[14]?.result as boolean | undefined;
  const nextBidId = primaryResults?.[15]?.result as bigint | undefined;

  // Derive phase — only when both block number and contract data are available.
  // Without this guard, on Arbitrum the block number (e.g. 300M) arrives before
  // startBlock/endBlock/claimBlock, causing getCCAPhase(300M, 0, 0, 0) → FAILED.
  const phase =
    currentBlockData !== undefined &&
    startBlock !== undefined &&
    endBlock !== undefined &&
    claimBlock !== undefined
      ? getCCAPhase(currentBlock, startBlock, endBlock, claimBlock, isGraduated ?? false)
      : CCAPhase.COMING_SOON;

  // ============================================
  // Secondary Multicall: Token metadata
  // ============================================
  const metadataContracts = useMemo(() => {
    if (!tokenAddress || !currencyAddress) return [];
    return [
      { address: tokenAddress, abi: ERC20_EXTENDED_ABI, functionName: "symbol" as const, chainId },
      {
        address: tokenAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "decimals" as const,
        chainId,
      },
      {
        address: currencyAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "symbol" as const,
        chainId,
      },
      {
        address: currencyAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "decimals" as const,
        chainId,
      },
    ];
  }, [tokenAddress, currencyAddress, chainId]);

  const { data: metadataResults, isLoading: isMetadataLoading } = useReadContracts({
    contracts: metadataContracts as never,
    query: { enabled: metadataContracts.length > 0, staleTime: 60_000 },
  });

  const mr = metadataResults as any[] | undefined;
  const tokenSymbol = mr?.[0]?.result as string | undefined;
  const tokenDecimals = mr?.[1]?.result as number | undefined;
  const currencySymbol = mr?.[2]?.result as string | undefined;
  const currencyDecimals = mr?.[3]?.result as number | undefined;

  // ============================================
  // Tertiary Multicall: User balances + Permit2 allowances
  // ============================================
  const userContracts = useMemo(() => {
    if (!connectedAddress || !currencyAddress) return [];
    if (currencyAddress === ZERO_ADDRESS) return [];
    return [
      // [0] ERC20 balance of user
      {
        address: currencyAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "balanceOf" as const,
        args: [connectedAddress],
        chainId,
      },
      // [1] ERC20 allowance: user → Permit2
      {
        address: currencyAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "allowance" as const,
        args: [connectedAddress, PERMIT2_ADDRESS],
        chainId,
      },
      // [2] Permit2 allowance: user → CCA (returns [amount, expiration, nonce])
      {
        address: PERMIT2_ADDRESS as Address,
        abi: PERMIT2_ABI,
        functionName: "allowance" as const,
        args: [connectedAddress, currencyAddress, ccaAddress],
        chainId,
      },
    ];
  }, [connectedAddress, currencyAddress, ccaAddress, chainId]);

  const { data: userResults } = useReadContracts({
    contracts: userContracts as never,
    query: { enabled: userContracts.length > 0, refetchInterval: 15000 },
  });

  const ur = userResults as any[] | undefined;
  const userCurrencyBalance = ur?.[0]?.result as bigint | undefined;
  const userErc20AllowanceForPermit2 = ur?.[1]?.result as bigint | undefined;
  // Permit2 allowance returns a tuple [amount, expiration, nonce]

  const permit2AllowanceResult = ur?.[2]?.result as any;
  const userPermit2AllowanceForCCA = permit2AllowanceResult?.[0] as bigint | undefined;

  // ============================================
  // Bid Discovery: scan all bids, filter user's
  // ============================================
  const bidCount = typeof nextBidId === "bigint" ? Number(nextBidId) : 0;

  const bidContracts = useMemo(() => {
    if (bidCount === 0) return [];
    return Array.from({ length: bidCount }, (_, i) => ({
      address: ccaAddress,
      abi: CCA_AUCTION_ABI,
      functionName: "bids" as const,
      args: [BigInt(i)] as const,
      chainId,
    }));
  }, [bidCount, ccaAddress, chainId]);

  const { data: bidResults } = useReadContracts({
    contracts: bidContracts,
    query: { enabled: bidContracts.length > 0, refetchInterval: 15000 },
  });

  const allBids: CCABidEntry[] = useMemo(() => {
    if (!bidResults) return [];

    const entries: CCABidEntry[] = [];
    for (let i = 0; i < bidResults.length; i++) {
      const raw = bidResults[i]?.result as any;
      if (!raw) continue;

      const bid: CCABidStruct = {
        startBlock: raw.startBlock ?? BigInt(0),
        startCumulativeMps: Number(raw.startCumulativeMps ?? 0),
        exitedBlock: raw.exitedBlock ?? BigInt(0),
        maxPrice: raw.maxPrice ?? BigInt(0),
        owner: raw.owner as Address,
        amountQ96: raw.amountQ96 ?? BigInt(0),
        tokensFilled: raw.tokensFilled ?? BigInt(0),
      };

      const isUserBid = connectedAddress
        ? bid.owner.toLowerCase() === connectedAddress.toLowerCase()
        : false;

      // On-chain status: exitedBlock > 0 means the bid was exited (settled).
      // We can't distinguish EXITED vs CLAIMED purely on-chain without events,
      // so we keep it as EXITED once exitedBlock is set. The UI uses phase +
      // tokensFilled to decide whether to show "Claim" or "Already settled".
      let status = BidStatus.ACTIVE;
      if (bid.exitedBlock > BigInt(0)) {
        status = BidStatus.EXITED;
      }

      entries.push({ bidId: i, bid, isUserBid, status });
    }
    return entries;
  }, [bidResults, connectedAddress]);

  const isLoading = isPrimaryLoading || isMetadataLoading || currentBlockData === undefined;

  return {
    isLoading,
    isError,
    refetch,

    tokenAddress,
    currencyAddress,
    totalSupply,
    floorPrice,
    tickSpacing,
    startBlock,
    endBlock,
    claimBlock,
    maxBidPrice,
    fundsRecipient,
    tokensRecipient,
    validationHook,

    clearingPrice,
    currencyRaised,
    isGraduated,

    tokenSymbol,
    tokenDecimals,
    currencySymbol,
    currencyDecimals,

    phase,
    currentBlock,

    allBids,
    userCurrencyBalance,
    userErc20AllowanceForPermit2,
    userPermit2AllowanceForCCA,

    connectedAddress,
    chainId,
    explorerUrl,
  };
}
