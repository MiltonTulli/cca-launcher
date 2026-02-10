"use client";

import { BidStatus } from "@/config/contracts";

const STATUS_STYLES: Record<BidStatus, { bg: string; text: string; border: string }> = {
  [BidStatus.ACTIVE]: {
    bg: "bg-green-50 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  [BidStatus.EXITED]: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
  [BidStatus.CLAIMED]: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
};

export function BidStatusBadge({ status }: { status: BidStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      {status}
    </span>
  );
}
