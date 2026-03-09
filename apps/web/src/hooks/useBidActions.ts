"use client";

import { useCallback, useEffect, useState } from "react";
import type { Hex } from "viem";
import { type Address, encodeFunctionData, maxUint256, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CCA_AUCTION_ABI,
  ERC20_EXTENDED_ABI,
  PERMIT2_ABI,
  PERMIT2_ADDRESS,
} from "@/config/contracts";
import { alignPriceToTick, decimalToTickAlignedQ96 } from "@/lib/q96";
import { type SimulationResult, simulateTransaction } from "@/lib/simulate";
import { ZERO_ADDRESS } from "@/lib/utils";

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
  permitterAddress?: Address;
  onSuccess?: () => void;
}

export function useBidActions({
  ccaAddress,
  currencyAddress,
  currencyDecimals,
  tokenDecimals,
  maxBidPrice,
  tickSpacing,
  permitterAddress,
  onSuccess,
}: UseBidActionsOptions) {
  const { address: owner } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<Error | null>(null);
  const [tenderlyResult, setTenderlyResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const needsPermit = !!permitterAddress && permitterAddress !== ZERO_ADDRESS;

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset: writeReset,
  } = useWriteContract();

  const error = simulationError || writeError;
  const reset = useCallback(() => {
    setSimulationError(null);
    setTenderlyResult(null);
    writeReset();
  }, [writeReset]);

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

  const isNativeCurrency = !currencyAddress || currencyAddress === ZERO_ADDRESS;

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
    async (amount: string, maxPriceInput: string, isMarketOrder: boolean) => {
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
      setSimulationError(null);

      let hookData: Hex = "0x";
      if (needsPermit) {
        try {
          const res = await fetch("/api/permit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bidder: owner,
              permitterAddress,
              chainId,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to fetch permit");
          }
          const data = await res.json();
          hookData = data.hookData as Hex;
        } catch (e) {
          setPendingAction(null);
          throw e;
        }
      }

      // Simulate first to catch reverts with a clear error instead of
      // sending a doomed tx to the wallet (which shows absurd gas estimates).
      if (publicClient) {
        try {
          await publicClient.simulateContract({
            address: ccaAddress,
            abi: CCA_AUCTION_ABI,
            functionName: "submitBid",
            args: [maxPriceQ96, amountUnits, owner, hookData],
            ...(isNativeCurrency ? { value: amountUnits } : {}),
            account: owner,
          });
        } catch (simError: unknown) {
          setPendingAction(null);
          console.error("[submitBid] Simulation reverted:", simError);
          const err = simError as any;
          const contractErrorName = err?.cause?.data?.errorName;
          const shortMsg = err?.shortMessage;
          const msg = contractErrorName
            ? `Contract error: ${contractErrorName}`
            : shortMsg || (simError instanceof Error ? simError.message : String(simError));
          setSimulationError(new Error(msg));
          return;
        }
      }

      writeContract({
        address: ccaAddress,
        abi: CCA_AUCTION_ABI,
        functionName: "submitBid",
        args: [maxPriceQ96, amountUnits, owner, hookData],
        ...(isNativeCurrency ? { value: amountUnits } : {}),
      });
    },
    [
      owner,
      currencyDecimals,
      tokenDecimals,
      tickSpacing,
      maxBidPrice,
      isNativeCurrency,
      ccaAddress,
      writeContract,
      needsPermit,
      permitterAddress,
      chainId,
      publicClient,
    ],
  );

  /** Simulate a bid on Tenderly without sending a transaction. */
  const simulateBid = useCallback(
    async (amount: string, maxPriceInput: string, isMarketOrder: boolean) => {
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

      setIsSimulating(true);
      setTenderlyResult(null);
      setSimulationError(null);

      let hookData: Hex = "0x";
      if (needsPermit) {
        try {
          const res = await fetch("/api/permit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bidder: owner,
              permitterAddress,
              chainId,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to fetch permit");
          }
          const data = await res.json();
          hookData = data.hookData as Hex;
        } catch (e) {
          setIsSimulating(false);
          setSimulationError(e instanceof Error ? e : new Error(String(e)));
          return;
        }
      }

      try {
        const input = encodeFunctionData({
          abi: CCA_AUCTION_ABI,
          functionName: "submitBid",
          args: [maxPriceQ96, amountUnits, owner, hookData],
        });

        const result = await simulateTransaction({
          from: owner,
          to: ccaAddress,
          input,
          networkId: chainId,
          value: isNativeCurrency ? amountUnits.toString() : undefined,
        });

        setTenderlyResult(result);

        if (!result.success) {
          setSimulationError(new Error(result.error || "Tenderly simulation failed"));
        }
      } catch (err) {
        setSimulationError(err instanceof Error ? err : new Error("Simulation failed"));
      } finally {
        setIsSimulating(false);
      }
    },
    [
      owner,
      currencyDecimals,
      tokenDecimals,
      tickSpacing,
      maxBidPrice,
      isNativeCurrency,
      ccaAddress,
      needsPermit,
      permitterAddress,
      chainId,
    ],
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
    simulateBid,
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
    tenderlyResult,
    isSimulating,
  };
}
