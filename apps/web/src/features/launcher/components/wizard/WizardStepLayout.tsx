"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface WizardStepLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isFirstStep?: boolean;
  error?: string | null;
}

export function WizardStepLayout({
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  isFirstStep,
  error,
}: WizardStepLayoutProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div>{children}</div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between pt-8 mt-2 border-t">
        {!isFirstStep && onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        ) : (
          <div />
        )}
        {onNext && (
          <Button type="button" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
            {nextLabel === "Continue" && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        )}
      </div>
    </div>
  );
}
