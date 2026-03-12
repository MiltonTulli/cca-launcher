"use client";

import { WIZARD_STEPS } from "./types";

interface WizardProgressProps {
  currentStep: number;
  onStepClick: (index: number) => void;
  completedSteps: Set<number>;
}

export function WizardProgress({ currentStep, onStepClick, completedSteps }: WizardProgressProps) {
  return (
    <nav aria-label="Wizard progress" className="mb-10">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </p>
        <p className="text-sm text-muted-foreground">{WIZARD_STEPS[currentStep].label}</p>
      </div>
      <div className="mt-2 flex gap-1">
        {WIZARD_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </nav>
  );
}
