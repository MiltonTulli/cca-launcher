import { isAddress } from "viem";
import type { LaunchFormValues } from "../../utils/toLaunchParams";
import type { WizardStepId } from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function validateStep(stepId: WizardStepId, values: LaunchFormValues): string | null {
  switch (stepId) {
    case "token":
      return validateTokenStep(values);
    case "core":
      return validateCoreStep(values);
    case "auction":
      return validateAuctionStep(values);
    case "liquidity":
      return validateLiquidityStep(values);
    case "settlement":
      return null; // always valid
    case "review":
      return validateAll(values);
    default:
      return null;
  }
}

function validateTokenStep(values: LaunchFormValues): string | null {
  const isCreateNew = values.tokenSource === "2";
  if (!isCreateNew && (!values.token || !isAddress(values.token))) {
    return "Token address is required for existing token sources";
  }
  if (!values.totalTokenAmount || Number(values.totalTokenAmount) <= 0) {
    return "Total token amount must be greater than 0";
  }
  return null;
}

function validateCoreStep(values: LaunchFormValues): string | null {
  if (values.paymentToken && values.paymentToken !== ZERO_ADDRESS && !isAddress(values.paymentToken)) {
    return "Payment token must be a valid address (leave empty for native ETH)";
  }
  if (!isAddress(values.operator)) {
    return "Operator address is required";
  }
  if (!isAddress(values.treasury)) {
    return "Treasury address is required";
  }
  return null;
}

function validateAuctionStep(values: LaunchFormValues): string | null {
  if (values.auctionEnd <= values.auctionStart) {
    return "Auction end must be after auction start";
  }
  if (!values.reservePrice || Number(values.reservePrice) <= 0) {
    return "Floor price must be greater than 0";
  }
  if (values.requiredCurrencyRaised && Number(values.requiredCurrencyRaised) < 0) {
    return "Required currency raised cannot be negative";
  }
  return null;
}

function validateLiquidityStep(values: LaunchFormValues): string | null {
  if (!values.liquidityEnabled) return null;
  if (!values.positionBeneficiary || !isAddress(values.positionBeneficiary)) {
    return "Position beneficiary must be a valid address";
  }
  if (Number(values.proceedsToLiquidityPercent) <= 0 || Number(values.proceedsToLiquidityPercent) > 100) {
    return "Proceeds to liquidity must be between 1 and 100";
  }
  return null;
}

function validateAll(values: LaunchFormValues): string | null {
  return (
    validateTokenStep(values) ??
    validateCoreStep(values) ??
    validateAuctionStep(values) ??
    validateLiquidityStep(values)
  );
}
