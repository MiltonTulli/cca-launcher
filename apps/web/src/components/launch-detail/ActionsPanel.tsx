"use client";

import { CheckCircle2 } from "lucide-react";
import React, { useEffect } from "react";
import type { Address } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { WalletButton } from "@/components/WalletButton";
import { CCA_AUCTION_ABI, LaunchState } from "@/config/contracts";
import { ActionButton } from "./ActionButton";
import { PreconditionChecklist } from "./PreconditionChecklist";
import type { PreconditionCheck } from "./types";

interface ActionsPanelProps {
  address: Address;
  currentState: LaunchState;
  connectedAddress: Address | undefined;
  isOperator: boolean;
  isPermissionless: boolean | undefined;
  auctionTimeElapsed: boolean;
  preconditionsByAction: Record<string, PreconditionCheck[]>;
  onRefresh: () => void;
  ccaAddress?: Address;
  ccaIsGraduated?: boolean;
}

export function ActionsPanel({
  address,
  currentState,
  connectedAddress,
  isOperator,
  isPermissionless,
  auctionTimeElapsed,
  preconditionsByAction,
  onRefresh,
  ccaAddress,
  ccaIsGraduated,
}: ActionsPanelProps) {
  const sections: React.ReactElement[] = [];

  // SETUP -> Finalize Setup
  if (connectedAddress && currentState === LaunchState.SETUP) {
    sections.push(
      <div key="finalize-setup" className="space-y-2">
        {preconditionsByAction.finalizeSetup && (
          <PreconditionChecklist
            checks={preconditionsByAction.finalizeSetup}
            action="Finalize Setup"
          />
        )}
        <ActionButton
          disabled={!isOperator}
          label="Finalize Setup"
          functionName="finalizeSetup"
          contractAddress={address}
          onSuccess={onRefresh}
          simulatable
        />
      </div>,
    );
  }

  // FINALIZED -> Start Auction
  if (connectedAddress && currentState === LaunchState.FINALIZED) {
    sections.push(
      <div key="start-auction" className="space-y-2">
        {preconditionsByAction.startAuction && (
          <PreconditionChecklist
            checks={preconditionsByAction.startAuction}
            action="Start Auction"
          />
        )}
        <ActionButton
          disabled={!isOperator}
          label="Start Auction"
          functionName="startAuction"
          contractAddress={address}
          gas={BigInt(15_000_000)}
          onSuccess={onRefresh}
          simulatable
        />
      </div>,
    );
  }

  // AUCTION_ENDED (or AUCTION_ACTIVE with time elapsed) -> distribution actions
  if (currentState === LaunchState.AUCTION_ENDED || auctionTimeElapsed) {
    const canAct = isOperator || isPermissionless;

    if (canAct) {
      sections.push(
        <div key="distribute-group" className="space-y-3">
          {preconditionsByAction.distributeAll && (
            <PreconditionChecklist
              checks={preconditionsByAction.distributeAll}
              action="Distribution"
            />
          )}
          {/* Sweep CCA funds to orchestrator (required before distribution) */}
          {ccaAddress && ccaIsGraduated && (
            <CcaSweepButton ccaAddress={ccaAddress} onSuccess={onRefresh} />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionButton
              label="Distribute All"
              functionName="distributeAll"
              contractAddress={address}
              onSuccess={onRefresh}
              simulatable
            />
            <ActionButton
              label="Distribute Liquidity"
              functionName="distributeLiquidity"
              contractAddress={address}
              variant="outline"
              onSuccess={onRefresh}
              simulatable
            />
          </div>
          {preconditionsByAction.distributeTreasury && (
            <PreconditionChecklist
              checks={[
                preconditionsByAction.distributeTreasury.find(
                  (c) => c.id === "liquidity-complete",
                )!,
              ].filter(Boolean)}
              action="Distribute Treasury"
            />
          )}
          <ActionButton
            label="Distribute Treasury"
            functionName="distributeTreasury"
            contractAddress={address}
            variant="outline"
            onSuccess={onRefresh}
            simulatable
          />
        </div>,
      );
    }

    // Finalize failed auction
    sections.push(
      <div key="finalize-failed" className="space-y-2">
        {preconditionsByAction.finalizeFailedAuction && (
          <PreconditionChecklist
            checks={preconditionsByAction.finalizeFailedAuction}
            action="Finalize Failed Auction"
          />
        )}
        <ActionButton
          label="Finalize Failed Auction"
          functionName="finalizeFailedAuction"
          contractAddress={address}
          variant="destructive"
          onSuccess={onRefresh}
          simulatable
        />
      </div>,
    );
  }

  // DISTRIBUTED / LOCKED / UNLOCKED -> sweep + withdraw
  if (
    currentState === LaunchState.DISTRIBUTED ||
    currentState === LaunchState.LOCKED ||
    currentState === LaunchState.UNLOCKED
  ) {
    if (isOperator) {
      sections.push(
        <div key="sweep-group" className="grid gap-3 sm:grid-cols-2">
          <ActionButton
            label="Sweep Token"
            functionName="sweepToken"
            contractAddress={address}
            variant="outline"
            onSuccess={onRefresh}
          />
          <ActionButton
            label="Sweep Payment Token"
            functionName="sweepPaymentToken"
            contractAddress={address}
            variant="outline"
            onSuccess={onRefresh}
          />
        </div>,
      );

      // Claim escrowed treasury payment (only when pending payment exists)
      if (preconditionsByAction.claimTreasuryPayment) {
        const hasPending = preconditionsByAction.claimTreasuryPayment.find(
          (c) => c.id === "has-pending-payment",
        )?.met;
        if (hasPending) {
          sections.push(
            <div key="claim-treasury" className="space-y-2">
              <PreconditionChecklist
                checks={preconditionsByAction.claimTreasuryPayment}
                action="Claim Treasury Payment"
              />
              <ActionButton
                label="Claim Treasury Payment"
                functionName="claimTreasuryPayment"
                contractAddress={address}
                onSuccess={onRefresh}
              />
            </div>,
          );
        }
      }
    }
    if (currentState === LaunchState.LOCKED && connectedAddress) {
      sections.push(
        <div key="withdraw-position" className="space-y-2">
          {preconditionsByAction.withdrawPosition && (
            <PreconditionChecklist
              checks={preconditionsByAction.withdrawPosition}
              action="Withdraw Position"
            />
          )}
          <ActionButton
            disabled={!isOperator}
            label="Withdraw Position"
            functionName="withdrawPosition"
            contractAddress={address}
            onSuccess={onRefresh}
          />
        </div>,
      );
    }
  }

  // Empty state messages
  if (sections.length === 0) {
    if (currentState === LaunchState.AUCTION_ACTIVE && !auctionTimeElapsed) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Auction is in progress. No actions available until it ends.
            </p>
          </CardContent>
        </Card>
      );
    }
    if (currentState === LaunchState.AUCTION_FAILED) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This auction has failed. No further actions are available.
            </p>
          </CardContent>
        </Card>
      );
    }
    if (!connectedAddress) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to perform actions on this launch.
            </p>
            <div>
              <WalletButton />
            </div>
          </CardContent>
        </Card>
      );
    }
    if (!isOperator) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only the operator can perform actions in this state.
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sections.map((section, i) => (
            <React.Fragment key={section.key}>
              {i > 0 && <Separator />}
              {section}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Calls CCA.sweepCurrency() to transfer raised funds to the orchestrator. */
function CcaSweepButton({ ccaAddress, onSuccess }: { ccaAddress: Address; onSuccess: () => void }) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      onSuccess();
      const timer = setTimeout(() => reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess, reset]);

  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        disabled={isPending || isConfirming}
        onClick={() => {
          reset();
          writeContract({
            address: ccaAddress,
            abi: CCA_AUCTION_ABI,
            functionName: "sweepCurrency",
          });
        }}
      >
        {isPending || isConfirming ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            {isPending ? "Confirm..." : "Sweeping funds..."}
          </span>
        ) : isSuccess ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Funds Swept
          </span>
        ) : (
          "Sweep CCA Funds to Orchestrator"
        )}
      </Button>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Transfers raised currency from the CCA to the orchestrator. Required before distribution.
      </p>
      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error.message.includes("User rejected")
            ? "Rejected"
            : error.message.length > 100
              ? `${error.message.slice(0, 100)}...`
              : error.message}
        </p>
      )}
    </div>
  );
}
