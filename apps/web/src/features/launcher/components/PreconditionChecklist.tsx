"use client";

import type { PreconditionCheck } from "../hooks/useLaunchPreconditions";

interface PreconditionChecklistProps {
  checks: PreconditionCheck[];
}

export function PreconditionChecklist({ checks }: PreconditionChecklistProps) {
  if (checks.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Preconditions</p>
      <ul className="space-y-1">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5">
              {check.loading ? (
                <span className="text-muted-foreground">&#x23F3;</span>
              ) : check.met ? (
                <span className="text-green-600">&#x2713;</span>
              ) : (
                <span className="text-red-500">&#x2717;</span>
              )}
            </span>
            <div>
              <span className={check.met ? "text-foreground" : "text-muted-foreground"}>
                {check.label}
              </span>
              <p className="text-xs text-muted-foreground">{check.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
