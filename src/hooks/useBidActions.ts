"use client";

import { useState, useEffect, useCallback } from "react";
import { Address, parseUnits, maxUint256 } from "viem";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  CCA_AUCTION_ABI,
  ERC20_EXTENDED_ABI,
  PERMIT2_ABI,
  PERMIT2_ADDRESS,
} from "@/config/contracts";
import { ZERO_ADDRESS } from "@/lib/utils";
import { alignPriceToTick, decimalToTickAlignedQ96 } from "@/lib/q96";

// Max uint160 for Permit2 approval amount
const MAX_UINT160 = BigInt("1461501637330902918203684832716283019655932542975");
// Max uint48 for Permit2 expiration (far future) — viem maps uint48 to number
const MAX_UINT48 = 281474976710655;

interface UseBidActionsOptions {
  ccaAddress: Address;
  currencyAddress: Address | undefined;
  currencyDecimals: number | undefined;
  tokenDecimals: number | undefined;
  maxBidPrice: bigint | undefined;
  tickSpacing: bigint | undefined;
  onSuccess?: () => void;
}

export function useBidActions({
  ccaAddress,
  currencyAddress,
  currencyDecimals,
  tokenDecimals,
  maxBidPrice,
  tickSpacing,
  onSuccess,
}: UseBidActionsOptions) {
  const { address: owner } = useAccount();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const {
    writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
      setPendingAction(null);
      const timer = setTimeout(() => reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess, reset]);

  const isNativeCurrency =
    !currencyAddress || currencyAddress === ZERO_ADDRESS;

  /**
   * Step 1: Approve Permit2 contract to spend the user's ERC20.
   * ERC20.approve(PERMIT2_ADDRESS, maxUint256)
   */
  const approveErc20ForPermit2 = useCallback(() => {
    if (!currencyAddress || isNativeCurrency) return;
    setPendingAction("approveErc20");
    writeContract({
      address: currencyAddress,
      abi: ERC20_EXTENDED_ABI,
      functionName: "approve",
      args: [PERMIT2_ADDRESS, maxUint256],
    });
  }, [currencyAddress, isNativeCurrency, writeContract]);

  /**
   * Step 2: Approve the CCA via Permit2.
   * Permit2.approve(currency, ccaAddress, maxUint160, maxUint48)
   */
  const approvePermit2ForCCA = useCallback(() => {
    if (!currencyAddress || isNativeCurrency) return;
    setPendingAction("approvePermit2");
    writeContract({
      address: PERMIT2_ADDRESS as Address,
      abi: PERMIT2_ABI,
      functionName: "approve",
      args: [currencyAddress, ccaAddress, MAX_UINT160, MAX_UINT48],
    });
  }, [currencyAddress, isNativeCurrency, ccaAddress, writeContract]);

  /** Submit a bid to the CCA contract. Both approvals must be done first for ERC20. */
  const submitBid = useCallback(
    (amount: string, maxPriceInput: string, isMarketOrder: boolean) => {
      if (!owner) return;
      const cDec = currencyDecimals ?? 18;
      const tDec = tokenDecimals ?? 18;
      const amountUnits = parseUnits(amount, cDec);
      const ts = tickSpacing ?? BigInt(1);

      let maxPriceQ96: bigint;
      if (isMarketOrder && maxBidPrice) {
        maxPriceQ96 = alignPriceToTick(maxBidPrice, ts);
      } else {
        maxPriceQ96 = decimalToTickAlignedQ96(maxPriceInput, ts, tDec, cDec);
      }

      if (maxPriceQ96 === BigInt(0)) return;

      setPendingAction("submitBid");
      writeContract({
        address: ccaAddress,
        abi: CCA_AUCTION_ABI,
        functionName: "submitBid",
        args: [maxPriceQ96, amountUnits, owner, "0x"],
        ...(isNativeCurrency ? { value: amountUnits } : {}),
      });
    },
    [owner, currencyDecimals, tokenDecimals, tickSpacing, maxBidPrice, isNativeCurrency, ccaAddress, writeContract],
  );

  const exitBid = useCallback(
    (bidId: number) => {
      setPendingAction("exitBid");
      writeContract({
        address: ccaAddress,
        abi: CCA_AUCTION_ABI,
        functionName: "exitBid",
        args: [BigInt(bidId)],
      });
    },
    [ccaAddress, writeContract],
  );

  const claimTokens = useCallback(
    (bidId: number) => {
      setPendingAction("claimTokens");
      writeContract({
        address: ccaAddress,
        abi: CCA_AUCTION_ABI,
        functionName: "claimTokens",
        args: [BigInt(bidId)],
      });
    },
    [ccaAddress, writeContract],
  );

  const claimTokensBatch = useCallback(
    (bidIds: number[]) => {
      if (!owner) return;
      setPendingAction("claimTokensBatch");
      writeContract({
        address: ccaAddress,
        abi: CCA_AUCTION_ABI,
        functionName: "claimTokensBatch",
        args: [owner, bidIds.map((id) => BigInt(id))],
      });
    },
    [owner, ccaAddress, writeContract],
  );

  return {
    approveErc20ForPermit2,
    approvePermit2ForCCA,
    submitBid,
    exitBid,
    claimTokens,
    claimTokensBatch,
    isPending,
    isConfirming,
    isSuccess,
    txHash,
    error,
    reset,
    pendingAction,
  };
}
