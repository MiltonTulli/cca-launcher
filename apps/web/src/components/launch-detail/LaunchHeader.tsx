"use client";

import { ExternalLink, FileText, RefreshCw, Shield } from "lucide-react";
import Link from "next/link";
import type { Address } from "viem";
import { ShareBar } from "@/components/ShareBar";
import { Button } from "@/components/ui/button";
import { CHAIN_METADATA } from "@/config/chains";
import { LAUNCH_STATE_COLORS, LAUNCH_STATE_LABELS, type LaunchState } from "@/config/contracts";
import type { LaunchInfo } from "./types";

interface LaunchHeaderProps {
  launchInfo: LaunchInfo;
  address: Address;
  currentState: LaunchState;
  isOperator: boolean;
  linkedDraftId: string | null;
  explorerUrl: string;
  chainId: number;
  onRefresh: () => void;
}

export function LaunchHeader({
  launchInfo,
  address,
  currentState,
  isOperator,
  linkedDraftId,
  explorerUrl,
  chainId,
  onRefresh,
}: LaunchHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">Launch #{launchInfo.launchId.toString()}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LAUNCH_STATE_COLORS[currentState]}`}
          >
            {LAUNCH_STATE_LABELS[currentState]}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {CHAIN_METADATA[chainId]?.name ?? `Chain ${chainId}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{address}</span>
          <a
            href={`${explorerUrl}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {isOperator && (
          <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5">
            <Shield className="h-3 w-3" />
            You are the operator
          </span>
        )}
        {linkedDraftId && (
          <Link
            href={`/drafts/${linkedDraftId}`}
            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-700 bg-blue-100 rounded-full px-2.5 py-0.5 hover:bg-blue-200 transition-colors"
          >
            <FileText className="h-3 w-3" />
            Created from draft
          </Link>
        )}
        <div className="mt-2">
          <ShareBar
            url={
              typeof window !== "undefined" ? `${window.location.origin}/launches/${address}` : ""
            }
            text={`Check out Launch #${launchInfo.launchId.toString()} on Tally Launch`}
          />
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
}
