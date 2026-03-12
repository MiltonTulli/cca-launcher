"use client";

import type { StepProps } from "./types";

export function SettlementStep({ values, updateField }: StepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <label className="text-sm font-medium">Distribution Delay (blocks)</label>
        <input
          type="number"
          value={values.distributionDelayBlocks}
          onChange={(e) => updateField("distributionDelayBlocks", e.target.value)}
          min="0"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          After this many blocks pass since auction settlement, anyone can trigger distribution
          (not just the operator). This prevents the operator from holding distribution hostage.
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">How distribution works:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>After the auction is settled, the operator can process distribution immediately.</li>
          <li>After the delay period, anyone can trigger distribution permissionlessly.</li>
          <li>Distribution sends tokens to buyers and proceeds to the treasury (or LP).</li>
        </ul>
      </div>
    </div>
  );
}
