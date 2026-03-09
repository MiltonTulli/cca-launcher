import type { Address } from "viem";

export interface LaunchDetailProps {
  address: Address;
}

export interface LaunchInfo {
  launchId: bigint;
  launcher: Address;
  token: Address;
  paymentToken: Address;
  operator: Address;
  treasury: Address;
  state: number;
  auctionDuration: bigint;
  pricingSteps: bigint;
  reservePrice: bigint;
  startTime: bigint;
  liquidityAllocation: bigint;
  treasuryAllocation: bigint;
  poolFeeTier: number;
  tickSpacing: number;
  lockupDuration: bigint;
  unlockTime: bigint;
  positionBeneficiary: Address;
  platformFeeOnLPFees: bigint;
}

export interface DistributionInfo {
  totalRaised: bigint;
  tokensSold: bigint;
  treasuryPaid: bigint;
  liquidityCreated: bigint;
  liquidityComplete: boolean;
  treasuryComplete: boolean;
  cca: Address;
  lockupContract: Address;
  positionTokenId: bigint;
}

export interface AuctionInfo {
  cca: Address;
  startTime: bigint;
  endTime: bigint;
  currentPrice: bigint;
  reservePrice: bigint;
  tokensSold: bigint;
  totalRaised: bigint;
  isActive: boolean;
  hasEnded: boolean;
}

export interface PreconditionCheck {
  id: string;
  label: string;
  description: string;
  met: boolean;
  loading?: boolean;
}
