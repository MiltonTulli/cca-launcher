import type { LaunchFormValues } from "../../utils/toLaunchParams";

export const WIZARD_STEPS = [
  { id: "token", label: "Token Setup", description: "Choose token source and amount" },
  { id: "core", label: "Core Settings", description: "Payment token, operator, and treasury" },
  { id: "auction", label: "Auction Rules", description: "Schedule and pricing" },
  { id: "liquidity", label: "Liquidity Setup", description: "Post-auction liquidity config" },
  { id: "settlement", label: "Settlement", description: "Distribution behavior" },
  { id: "review", label: "Review & Confirm", description: "Verify and submit" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export interface StepProps {
  values: LaunchFormValues;
  updateField: (field: keyof LaunchFormValues, value: string | boolean) => void;
  chainId: number;
}
