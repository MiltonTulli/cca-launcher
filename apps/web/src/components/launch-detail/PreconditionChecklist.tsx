"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { PreconditionCheck } from "./types";

interface PreconditionChecklistProps {
  checks: PreconditionCheck[];
  action: string;
}

export function PreconditionChecklist({ checks, action }: PreconditionChecklistProps) {
  if (checks.length === 0) return null;

  return (
    <div className="rounded-lg border p-3 mb-2 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Info className="h-3 w-3" />
        Requirements for {action}
      </p>
      <ul className="space-y-1.5">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-xs">
            {check.loading ? (
              <Spinner size="sm" className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            ) : check.met ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
            )}
            <div>
              <span className={check.met ? "text-foreground" : "text-red-600 font-medium"}>
                {check.label}
              </span>
              {check.description && (
                <p className="text-muted-foreground text-[11px] leading-tight mt-0.5">
                  {check.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
