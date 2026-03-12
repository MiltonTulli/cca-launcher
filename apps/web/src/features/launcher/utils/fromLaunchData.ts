import {
  type LaunchState,
  type LiquidityState,
  type TokenSource,
  type LiquidityInfo,
} from "../config";
// LiquidityState is only used as a type cast in the array→object mapping
import type { Address } from "viem";

/** Typed representation of all orchestrator data */
export interface LaunchData {
  // Identity
  launchId: bigint;
  operator: Address;
  pendingOperator: Address;
  token: Address;
  paymentToken: Address;
  tokenSource: TokenSource;

  // State
  state: LaunchState;

  // Auction config
  auctionStartBlock: bigint;
  auctionEndBlockConfig: bigint;
  auctionEndBlock: bigint;
  claimBlock: bigint;
  auctionTickSpacing: bigint;
  auctionTokenAmount: bigint;
  liquidityTokenAmount: bigint;
  reservePrice: bigint;
  requiredCurrencyRaised: bigint;
  validationHook: Address;
  cca: Address;

  // Settlement
  treasuryAddress: Address;
  permissionlessDistributionDelay: bigint;
  totalRaised: bigint;
  tokensSold: bigint;
  distributionTimestamp: bigint;
  isDistributionPermissionless: boolean;

  // Liquidity config
  liquidityEnabled: boolean;
  proceedsToLiquidityBps: number;
  positionBeneficiary: Address;
  poolFee: number;
  tickSpacing: number;
  tickLower: number;
  tickUpper: number;
  lockupEnabled: boolean;
  lockupDuration: bigint;

  // Liquidity state
  liquidityInfo: LiquidityInfo;

  // Platform fees (snapshotted)
  saleFeeBpsSnapshot: number;
  lpFeeShareBps: number;
  platformFeeRecipient: Address;

  // Metadata
  metadataHash: `0x${string}`;
}

/**
 * Maps ordered multicall results to a typed LaunchData object.
 * The order MUST match the contract calls in useLaunch hook.
 */
export function fromLaunchData(results: readonly unknown[]): LaunchData {
  let i = 0;
  return {
    operator: results[i++] as Address,
    state: results[i++] as LaunchState,
    token: results[i++] as Address,
    paymentToken: results[i++] as Address,
    launchId: results[i++] as bigint,
    tokenSource: results[i++] as TokenSource,
    auctionStartBlock: results[i++] as bigint,
    auctionEndBlockConfig: results[i++] as bigint,
    auctionEndBlock: results[i++] as bigint,
    claimBlock: results[i++] as bigint,
    auctionTickSpacing: results[i++] as bigint,
    auctionTokenAmount: results[i++] as bigint,
    liquidityTokenAmount: results[i++] as bigint,
    reservePrice: results[i++] as bigint,
    requiredCurrencyRaised: results[i++] as bigint,
    validationHook: results[i++] as Address,
    cca: results[i++] as Address,
    treasuryAddress: results[i++] as Address,
    permissionlessDistributionDelay: results[i++] as bigint,
    totalRaised: results[i++] as bigint,
    tokensSold: results[i++] as bigint,
    distributionTimestamp: results[i++] as bigint,
    isDistributionPermissionless: results[i++] as boolean,
    liquidityEnabled: results[i++] as boolean,
    proceedsToLiquidityBps: results[i++] as number,
    positionBeneficiary: results[i++] as Address,
    poolFee: results[i++] as number,
    tickSpacing: results[i++] as number,
    tickLower: results[i++] as number,
    tickUpper: results[i++] as number,
    lockupEnabled: results[i++] as boolean,
    lockupDuration: results[i++] as bigint,
    liquidityInfo: (() => {
      const li = results[i++];
      if (Array.isArray(li)) {
        return {
          state: li[0] as LiquidityState,
          vault: li[1] as Address,
          lockup: li[2] as Address,
          positionTokenId: li[3] as bigint,
          unlockTimestamp: li[4] as bigint,
        } as LiquidityInfo;
      }
      return li as LiquidityInfo;
    })(),
    pendingOperator: results[i++] as Address,
    metadataHash: results[i++] as `0x${string}`,
    saleFeeBpsSnapshot: results[i++] as number,
    lpFeeShareBps: results[i++] as number,
    platformFeeRecipient: results[i++] as Address,
  };
}
