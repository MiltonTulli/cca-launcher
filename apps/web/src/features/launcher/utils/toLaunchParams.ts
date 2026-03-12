import { type LaunchParams, type TokenSource, TICK_SPACING_BY_FEE } from "../config";
import { type Address, parseUnits, pad } from "viem";
import { estimateBlockAtTimestamp, datetimeLocalToTimestamp, encodeAuctionStepsData } from "./blockEstimation";

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

/** User-friendly form values (all strings for form inputs) */
export interface LaunchFormValues {
  tokenSource: string;
  token: string;
  paymentToken: string;
  operator: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: string;
  tokenInitialSupply: string;

  // Auction timing — datetime-local strings (e.g. "2025-06-15T14:00")
  auctionStart: string;
  auctionEnd: string;
  claimDelay: string; // minutes after auction end

  reservePrice: string;
  auctionTickSpacing: string;
  requiredCurrencyRaised: string;

  // Token allocation — total amount + percentage to liquidity
  totalTokenAmount: string;
  liquidityPercent: string; // "30" = 30% goes to LP, 70% to auction

  // Liquidity config
  liquidityEnabled: boolean;
  proceedsToLiquidityPercent: string;
  positionBeneficiary: string;
  poolFeeTier: string;
  tickLower: string;
  tickUpper: string;
  lockupEnabled: boolean;
  lockupDurationDays: string;

  // Settlement
  treasury: string;
  distributionDelayBlocks: string;

  // Metadata
  metadataHash: string;

  // Payment token decimals (for price formatting)
  paymentTokenDecimals: string;
}

interface BlockContext {
  currentBlock: bigint;
  currentTimestamp: number;
  chainId: number;
}

/**
 * Converts user-friendly form values into the nested LaunchParams struct
 * expected by the smart contract.
 *
 * Requires block context to estimate block numbers from datetime inputs.
 */
export function toLaunchParams(values: LaunchFormValues, ctx: BlockContext): LaunchParams {
  const tokenDecimals = Number(values.tokenDecimals);
  const paymentTokenDecimals = Number(values.paymentTokenDecimals);

  // Convert datetime strings to block estimates
  const startTimestamp = datetimeLocalToTimestamp(values.auctionStart);
  const endTimestamp = datetimeLocalToTimestamp(values.auctionEnd);
  const claimDelayMinutes = Number(values.claimDelay || "0");
  const claimTimestamp = endTimestamp + claimDelayMinutes * 60;

  const startBlock = estimateBlockAtTimestamp(startTimestamp, ctx.currentBlock, ctx.currentTimestamp, ctx.chainId);
  const endBlock = estimateBlockAtTimestamp(endTimestamp, ctx.currentBlock, ctx.currentTimestamp, ctx.chainId);
  const claimBlock = estimateBlockAtTimestamp(claimTimestamp, ctx.currentBlock, ctx.currentTimestamp, ctx.chainId);

  // Calculate token allocation from total + percentage
  const totalTokens = parseUnits(values.totalTokenAmount, tokenDecimals);
  let auctionTokenAmount: bigint;
  let liquidityTokenAmount: bigint;

  if (values.liquidityEnabled && Number(values.liquidityPercent) > 0) {
    const lpBps = Math.round(Number(values.liquidityPercent) * 100); // percent to bps
    liquidityTokenAmount = (totalTokens * BigInt(lpBps)) / BigInt(10000);
    auctionTokenAmount = totalTokens - liquidityTokenAmount;
  } else {
    auctionTokenAmount = totalTokens;
    liquidityTokenAmount = BigInt(0);
  }

  return {
    tokenSource: Number(values.tokenSource) as TokenSource,
    token: (values.token || ZERO_ADDRESS) as Address,
    paymentToken: (values.paymentToken || ZERO_ADDRESS) as Address,
    operator: (values.operator || ZERO_ADDRESS) as Address,
    auctionConfig: {
      startBlock,
      endBlock,
      claimBlock,
      auctionTickSpacing: BigInt(values.auctionTickSpacing || "1"),
      reservePrice: parseUnits(values.reservePrice, paymentTokenDecimals),
      requiredCurrencyRaised: parseUnits(values.requiredCurrencyRaised || "0", paymentTokenDecimals),
      auctionStepsData: encodeAuctionStepsData(startBlock, endBlock),
      validationHook: ZERO_ADDRESS as Address,
    },
    tokenAllocation: {
      auctionTokenAmount,
      liquidityTokenAmount,
    },
    liquidityConfig: {
      enabled: values.liquidityEnabled,
      proceedsToLiquidityBps: Math.round(
        Number(values.proceedsToLiquidityPercent) * 100
      ),
      positionBeneficiary: (values.positionBeneficiary ||
        ZERO_ADDRESS) as Address,
      poolFee: Number(values.poolFeeTier),
      tickSpacing: TICK_SPACING_BY_FEE[Number(values.poolFeeTier)] ?? 60,
      tickLower: Number(values.tickLower),
      tickUpper: Number(values.tickUpper),
      lockupEnabled: values.lockupEnabled,
      lockupDuration: BigInt(Number(values.lockupDurationDays) * 86400),
    },
    settlementConfig: {
      treasury: values.treasury as Address,
      permissionlessDistributionDelay: BigInt(
        values.distributionDelayBlocks
      ),
    },
    metadataHash: values.metadataHash
      ? pad(values.metadataHash as `0x${string}`, { size: 32 })
      : "0x0000000000000000000000000000000000000000000000000000000000000000",
  };
}
