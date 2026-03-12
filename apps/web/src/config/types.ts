import type { Address } from "viem";
import { SEPOLIA_CONTRACTS } from "./addresses";
import { type BidStatus, TokenSource } from "./enums";

// ============================================
// TYPES
// ============================================

// LaunchParams type (matches contract struct)
export interface LaunchParams {
  tokenSource: TokenSource;
  tokenAmount: bigint;
  auctionDuration: bigint;
  pricingSteps: bigint;
  reservePrice: bigint;
  startTime: bigint;
  liquidityAllocation: bigint;
  treasuryAllocation: bigint;
  treasury: Address;
  poolFeeTier: number;
  tickSpacing: number;
  lockupDuration: bigint;
  distributionDelay: bigint;
  positionBeneficiary: Address;
  validationHook: Address;
}

// Form values type (user-friendly)
export interface LaunchFormValues {
  // Token config
  token: string;
  paymentToken: string;
  operator: string;
  tokenSource: string;
  tokenAmount: string;
  tokenDecimals: string;
  paymentTokenDecimals: string;
  // Auction config
  auctionDurationDays: string;
  auctionDurationHours: string;
  pricingSteps: string;
  reservePrice: string;
  startTime: string; // "0" for immediate, or ISO timestamp
  // Allocation
  liquidityAllocationPercent: string;
  treasuryAllocationPercent: string;
  treasury: string;
  // Pool config
  poolFeeTier: string;
  tickSpacing: string;
  // Lockup config
  lockupDurationDays: string;
  distributionDelayDays: string;
  positionBeneficiary: string;
  // Validation
  validationHook: string;
}

// ============================================
// DEFAULT FORM VALUES
// ============================================
export const DEFAULT_FORM_VALUES: LaunchFormValues = {
  token: "",
  paymentToken: "",
  operator: "",
  tokenSource: TokenSource.TRANSFER.toString(),
  tokenAmount: "",
  tokenDecimals: "18",
  paymentTokenDecimals: "18",
  auctionDurationDays: "7",
  auctionDurationHours: "0",
  pricingSteps: "100",
  reservePrice: "",
  startTime: "0",
  liquidityAllocationPercent: "50",
  treasuryAllocationPercent: "50",
  treasury: "",
  poolFeeTier: "3000",
  tickSpacing: "60",
  lockupDurationDays: "180",
  distributionDelayDays: "0",
  positionBeneficiary: "",
  validationHook: "0x0000000000000000000000000000000000000000",
};

// ============================================
// PRESETS
// ============================================
export interface LaunchPreset {
  id: string;
  name: string;
  description: string;
  values: Partial<LaunchFormValues>;
}

export const LAUNCH_PRESETS: LaunchPreset[] = [
  {
    id: "test-case-1",
    name: "Test Case 1: Basic Launch",
    description: "1M auction tokens, 1 hour auction, 50/50 split, 0.3% fee tier",
    values: {
      token: SEPOLIA_CONTRACTS.AuctionToken,
      paymentToken: SEPOLIA_CONTRACTS.TestUSDC,
      tokenSource: TokenSource.TRANSFER.toString(),
      tokenAmount: "1000000",
      tokenDecimals: "18",
      paymentTokenDecimals: "6",
      auctionDurationDays: "0",
      auctionDurationHours: "1",
      pricingSteps: "100",
      reservePrice: "0.1",
      startTime: "0",
      liquidityAllocationPercent: "50",
      treasuryAllocationPercent: "50",
      poolFeeTier: "3000",
      tickSpacing: "60",
      lockupDurationDays: "0",
      distributionDelayDays: "0",
      validationHook: "0x0000000000000000000000000000000000000000",
    },
  },
  {
    id: "production-launch",
    name: "Production Launch",
    description: "7 day auction, 80/20 liquidity split, 6 month lockup",
    values: {
      tokenSource: TokenSource.TRANSFER.toString(),
      tokenDecimals: "18",
      paymentTokenDecimals: "18",
      auctionDurationDays: "7",
      auctionDurationHours: "0",
      pricingSteps: "500",
      startTime: "0",
      liquidityAllocationPercent: "80",
      treasuryAllocationPercent: "20",
      poolFeeTier: "3000",
      tickSpacing: "60",
      lockupDurationDays: "180",
      distributionDelayDays: "1",
      validationHook: "0x0000000000000000000000000000000000000000",
    },
  },
  {
    id: "quick-test",
    name: "Quick Test (Sepolia)",
    description: "Minimum duration, short lockup, pre-filled test tokens",
    values: {
      token: SEPOLIA_CONTRACTS.AuctionToken,
      paymentToken: SEPOLIA_CONTRACTS.TestUSDC,
      tokenSource: TokenSource.TRANSFER.toString(),
      tokenAmount: "10000",
      tokenDecimals: "18",
      paymentTokenDecimals: "6",
      auctionDurationDays: "0",
      auctionDurationHours: "1",
      pricingSteps: "10",
      reservePrice: "0.01",
      startTime: "0",
      liquidityAllocationPercent: "50",
      treasuryAllocationPercent: "50",
      poolFeeTier: "3000",
      tickSpacing: "60",
      lockupDurationDays: "0",
      distributionDelayDays: "0",
      validationHook: "0x0000000000000000000000000000000000000000",
    },
  },
];

// ============================================
// WIZARD STEPS
// ============================================
export const WIZARD_STEPS = [
  {
    id: "setup",
    number: 1,
    title: "Setup",
    description: "Configure tokens and mint/transfer to operator",
  },
  {
    id: "create-permitter",
    number: 2,
    title: "Permitter (Optional)",
    description: "Create validation hook if needed",
  },
  {
    id: "create-launch",
    number: 3,
    title: "Create Launch",
    description: "Deploy orchestrator via factory",
  },
  {
    id: "fund-auction",
    number: 4,
    title: "Fund & Start",
    description: "Transfer tokens and start auction",
  },
  {
    id: "place-bids",
    number: 5,
    title: "Place Bids",
    description: "Bidders submit bids through CCA",
  },
  {
    id: "finalize",
    number: 6,
    title: "Finalize",
    description: "End auction and determine clearing price",
  },
  {
    id: "distribute",
    number: 7,
    title: "Distribute",
    description: "Distribute tokens and create LP",
  },
  {
    id: "verify-lockup",
    number: 8,
    title: "Verify Lockup",
    description: "Confirm position lock and fee collection",
  },
  {
    id: "unlock",
    number: 9,
    title: "Unlock",
    description: "Withdraw position after lockup period",
  },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

// ============================================
// CCA TYPES
// ============================================

/** On-chain Bid struct from CCA contract */
export interface CCABidStruct {
  startBlock: bigint;
  startCumulativeMps: number;
  exitedBlock: bigint;
  maxPrice: bigint;
  owner: Address;
  amountQ96: bigint;
  tokensFilled: bigint;
}

/** Enriched bid entry for UI */
export interface CCABidEntry {
  bidId: number;
  bid: CCABidStruct;
  isUserBid: boolean;
  status: BidStatus;
}

/** Auction entry for the auctions list page */
export interface AuctionEntry {
  ccaAddress: Address;
  orchestratorAddress: Address;
  token: Address;
  launchId: bigint;
  launchState: number;
  chainId: number;
  startTime: bigint;
  endTime: bigint;
  currentPrice: bigint;
  tokensSold: bigint;
  totalRaised: bigint;
  isActive: boolean;
  hasEnded: boolean;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimals?: number;
  currencySymbol?: string;
  currencyDecimals?: number;
  paymentToken?: Address;
}
