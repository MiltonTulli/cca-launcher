"use client";

import { useState, useEffect } from "react";
import { LaunchState, TokenSource, LiquidityState, launchOrchestratorAbi } from "@launcher/sdk";
import { parseUnits, formatUnits } from "viem";
import type { Address } from "viem";
import type { LaunchData } from "../utils/fromLaunchData";
import type { EffectiveLaunchState } from "../utils/displayState";
import { getDistributionAccessLabel } from "../utils/displayState";
import type { ActionPreconditions } from "../hooks/useLaunchPreconditions";
import { ActionButton } from "./ActionButton";
import { PreconditionChecklist } from "./PreconditionChecklist";
import { useCreateToken } from "../hooks/useCreateToken";
import { useFinalizeSetup } from "../hooks/useFinalizeSetup";
import { useSettleAuction } from "../hooks/useSettleAuction";
import { useProcessDistribution } from "../hooks/useProcessDistribution";
import { useCancel } from "../hooks/useCancel";
import { useEmergencyRescue } from "../hooks/useEmergencyRescue";
import { useAccount } from "wagmi";

interface ActionsPanelProps {
  launchData: LaunchData;
  launchAddress: Address;
  effectiveState: EffectiveLaunchState;
  preconditions: ActionPreconditions;
  chainId?: number;
  blocksUntilAuctionStart?: bigint;
  blocksUntilAuctionEnd?: bigint;
  onActionSuccess?: () => void;
}

export function ActionsPanel({
  launchData,
  launchAddress,
  effectiveState,
  preconditions,
  chainId,
  blocksUntilAuctionStart,
  blocksUntilAuctionEnd,
  onActionSuccess,
}: ActionsPanelProps) {
  const { address: userAddress } = useAccount();
  const isOperator = userAddress?.toLowerCase() === launchData.operator.toLowerCase();

  const { createToken, tokenCreationFee, isPending: isCreatingToken, isConfirming: isConfirmingCreate, isSuccess: isCreateSuccess } = useCreateToken(launchAddress, chainId);
  const { finalizeSetup, isPending: isFinalizing, isConfirming: isConfirmingFinalize, isSuccess: isFinalizeSuccess } = useFinalizeSetup(launchAddress, chainId);
  const { settleAuction, isPending: isSettling, isConfirming: isConfirmingSettle, isSuccess: isSettleSuccess } = useSettleAuction(launchAddress, chainId);
  const { processDistribution, isPending: isDistributing, isConfirming: isConfirmingDistribute, isSuccess: isDistributeSuccess } = useProcessDistribution(launchAddress, chainId);
  const { cancel, isPending: isCancelling } = useCancel(launchAddress, chainId);
  const { emergencyRescue } = useEmergencyRescue(launchAddress, chainId);

  // Refetch launch data when any action succeeds
  useEffect(() => {
    if (isCreateSuccess || isFinalizeSuccess || isSettleSuccess || isDistributeSuccess) {
      onActionSuccess?.();
    }
  }, [isCreateSuccess, isFinalizeSuccess, isSettleSuccess, isDistributeSuccess, onActionSuccess]);

  const allMet = (action: string) => preconditions[action]?.every((c) => c.met) ?? false;

  const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as Address;

  // SETUP state
  if (launchData.state === LaunchState.SETUP) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Setup Actions</h3>

        {/* Create Token - only for CREATE_NEW when token not yet created */}
        {launchData.tokenSource === TokenSource.CREATE_NEW &&
          launchData.token === "0x0000000000000000000000000000000000000000" &&
          preconditions.createToken && (
          <CreateTokenSection
            preconditions={preconditions.createToken}
            allMet={allMet("createToken")}
            createToken={createToken}
            tokenCreationFee={tokenCreationFee}
            operator={launchData.operator}
            totalTokenAmount={launchData.auctionTokenAmount + launchData.liquidityTokenAmount}
            isPending={isCreatingToken}
            isConfirming={isConfirmingCreate}
            isSuccess={isCreateSuccess}
          />
        )}

        {/* Finalize Setup */}
        {preconditions.finalizeSetup && (
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-medium">Finalize Setup</h4>
            <PreconditionChecklist checks={preconditions.finalizeSetup} />
            {isConfirmingFinalize && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Confirming transaction...
              </div>
            )}
            {isFinalizeSuccess && (
              <p className="text-sm text-green-600">Setup finalized successfully!</p>
            )}
            <ActionButton
              label={isFinalizing ? "Confirm in wallet..." : isConfirmingFinalize ? "Confirming..." : "Finalize Setup"}
              onClick={() => finalizeSetup()}
              disabled={!allMet("finalizeSetup") || isFinalizing || isConfirmingFinalize}
              simulate={{
                abi: launchOrchestratorAbi,
                functionName: "finalizeSetup",
                contractAddress: launchAddress,
                chainId,
              }}
            />
          </div>
        )}

        {/* Cancel */}
        {preconditions.cancel && (
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-medium">Cancel Launch</h4>
            <PreconditionChecklist checks={preconditions.cancel} />
            <ActionButton
              label="Cancel Launch"
              onClick={() => cancel()}
              disabled={!allMet("cancel")}
              variant="destructive"
            />
          </div>
        )}
      </div>
    );
  }

  // FINALIZED state (with sub-states)
  if (effectiveState === "AUCTION_ACTIVE" || (launchData.state === LaunchState.FINALIZED && blocksUntilAuctionStart && blocksUntilAuctionStart > BigInt(0))) {
    // Auction not started yet or active
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Auction</h3>
        {blocksUntilAuctionStart && blocksUntilAuctionStart > BigInt(0) ? (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Auction starts in <span className="font-mono font-medium text-foreground">{blocksUntilAuctionStart.toString()}</span> blocks
            </p>
          </div>
        ) : (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Auction in progress — ends in <span className="font-mono font-medium text-foreground">{blocksUntilAuctionEnd?.toString() ?? "?"}</span> blocks
            </p>
          </div>
        )}
      </div>
    );
  }

  // FINALIZED but auction ended (needs settlement)
  if (launchData.state === LaunchState.FINALIZED && preconditions.settleAuction) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Settle Auction</h3>
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">The auction has ended and needs to be settled.</p>
          <PreconditionChecklist checks={preconditions.settleAuction} />
          {isConfirmingSettle && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Confirming transaction...
            </div>
          )}
          <ActionButton
            label={isSettling ? "Confirm in wallet..." : isConfirmingSettle ? "Confirming..." : "Settle Auction"}
            onClick={() => settleAuction()}
            disabled={!allMet("settleAuction") || isSettling || isConfirmingSettle}
            simulate={{
              abi: launchOrchestratorAbi,
              functionName: "settleAuction",
              contractAddress: launchAddress,
              chainId,
            }}
          />
        </div>
      </div>
    );
  }

  // AUCTION_ENDED
  if (launchData.state === LaunchState.AUCTION_ENDED) {
    const distributionChecks = preconditions.processDistribution;
    const canDistribute = distributionChecks?.every((c) => c.met) ?? false;
    const isPermissionless = launchData.isDistributionPermissionless;
    const buttonLabel = getDistributionAccessLabel(isOperator, isPermissionless);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Distribution</h3>
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Auction raised {launchData.totalRaised.toString()} — {launchData.tokensSold.toString()} tokens sold.
          </p>
          {distributionChecks && <PreconditionChecklist checks={distributionChecks} />}
          {isConfirmingDistribute && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Confirming transaction...
            </div>
          )}
          <ActionButton
            label={isDistributing ? "Confirm in wallet..." : isConfirmingDistribute ? "Confirming..." : buttonLabel}
            onClick={() => processDistribution()}
            disabled={!canDistribute || isDistributing || isConfirmingDistribute}
            simulate={{
              abi: launchOrchestratorAbi,
              functionName: "processDistribution",
              contractAddress: launchAddress,
              chainId,
            }}
          />
        </div>
      </div>
    );
  }

  // DISTRIBUTED
  if (launchData.state === LaunchState.DISTRIBUTED) {
    const liqState = launchData.liquidityInfo?.state;
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Post-Distribution</h3>

        {/* Sweep actions - operator only */}
        {isOperator && (
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-medium">Sweep Residual Tokens</h4>
            <div className="flex gap-2">
              <ActionButton
                label="Sweep Token"
                onClick={async () => {
                  // Direct writeContract call would go here
                  // For now using the pattern from the hooks
                }}
                variant="outline"
              />
              <ActionButton
                label="Sweep Payment Token"
                onClick={async () => {}}
                variant="outline"
              />
            </div>
          </div>
        )}

        {/* Liquidity vault actions */}
        {launchData.liquidityInfo?.vault && launchData.liquidityInfo.vault !== "0x0000000000000000000000000000000000000000" && (
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-medium">Liquidity Position</h4>

            {liqState === LiquidityState.LOCKED && (
              <p className="text-sm text-muted-foreground">
                Position locked until {new Date(Number(launchData.liquidityInfo.unlockTimestamp) * 1000).toLocaleString()}
              </p>
            )}

            {liqState === LiquidityState.UNLOCKED && isOperator && (
              <ActionButton label="Withdraw Position" onClick={async () => {}} variant="outline" />
            )}

            {liqState === LiquidityState.WITHDRAWN && (
              <p className="text-sm text-muted-foreground">Position has been withdrawn.</p>
            )}

            {liqState !== LiquidityState.NONE && liqState !== LiquidityState.WITHDRAWN && (
              <ActionButton label="Collect & Split Fees" onClick={async () => {}} variant="outline" />
            )}
          </div>
        )}
      </div>
    );
  }

  // CANCELLED
  if (launchData.state === LaunchState.CANCELLED) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">This launch has been cancelled.</p>
        </div>
        {isOperator && (
          <EmergencyRescueSection
            token={launchData.token}
            emergencyRescue={emergencyRescue}
            launchAddress={launchAddress}
            chainId={chainId}
          />
        )}
      </div>
    );
  }

  // AUCTION_FAILED
  if (launchData.state === LaunchState.AUCTION_FAILED) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">The auction did not graduate.</p>
        </div>
        {isOperator && (
          <EmergencyRescueSection
            token={launchData.token}
            emergencyRescue={emergencyRescue}
            launchAddress={launchAddress}
            chainId={chainId}
          />
        )}
      </div>
    );
  }

  return null;
}

/** Sub-component: Create Token form for SETUP + CREATE_NEW */
function CreateTokenSection({
  preconditions,
  allMet,
  createToken,
  tokenCreationFee,
  operator,
  totalTokenAmount,
  isPending,
  isConfirming,
  isSuccess,
}: {
  preconditions: import("../hooks/useLaunchPreconditions").PreconditionCheck[];
  allMet: boolean;
  createToken: (params: import("@launcher/sdk").TokenCreationParams) => Promise<unknown>;
  tokenCreationFee?: bigint;
  operator: Address;
  totalTokenAmount: bigint;
  isPending?: boolean;
  isConfirming?: boolean;
  isSuccess?: boolean;
}) {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  const TOKEN_DECIMALS = 18;
  const formattedSupply = formatUnits(totalTokenAmount, TOKEN_DECIMALS);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h4 className="font-medium">Create Token</h4>
      {isSuccess ? (
        <p className="text-sm text-green-600">Token created successfully! Data will refresh shortly.</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          The token has not been created yet. Fill in the token details and create it before finalizing setup.
        </p>
      )}
      {tokenCreationFee !== undefined && tokenCreationFee > BigInt(0) && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1">
          Creation fee: {(Number(tokenCreationFee) / 1e18).toFixed(6)} ETH
        </p>
      )}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Name</label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="My Token"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Symbol</label>
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="MTK"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Decimals</label>
            <input
              type="number"
              value={TOKEN_DECIMALS}
              disabled
              className="w-full rounded-md border px-2 py-1.5 text-sm bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Initial Supply</label>
            <input
              type="text"
              value={formattedSupply}
              disabled
              className="w-full rounded-md border px-2 py-1.5 text-sm bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-0.5">Matches total token amount from launch config.</p>
          </div>
        </div>
      </div>
      <PreconditionChecklist checks={preconditions} />
      {isConfirming && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Confirming transaction...
        </div>
      )}
      <ActionButton
        label={isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : "Create Token"}
        onClick={() => createToken({
          name: tokenName,
          symbol: tokenSymbol,
          decimals: TOKEN_DECIMALS,
          initialSupply: totalTokenAmount,
          initialHolder: operator,
        })}
        disabled={!allMet || !tokenName || !tokenSymbol || isPending || isConfirming || isSuccess}
      />
    </div>
  );
}

/** Sub-component: Emergency Rescue for terminal states */
function EmergencyRescueSection({
  token,
  emergencyRescue,
  launchAddress,
  chainId,
}: {
  token: Address;
  emergencyRescue: (tokenAddress: Address) => Promise<unknown>;
  launchAddress: Address;
  chainId?: number;
}) {
  const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as Address;
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <h4 className="font-medium">Emergency Rescue</h4>
      <p className="text-xs text-muted-foreground">
        Rescue stuck tokens or ETH from the orchestrator to the treasury.
      </p>
      <div className="flex flex-col gap-2">
        {token !== ZERO_ADDR && (
          <ActionButton
            label="Rescue Token"
            onClick={() => emergencyRescue(token)}
            variant="outline"
            simulate={{
              abi: launchOrchestratorAbi,
              functionName: "emergencyRescue",
              contractAddress: launchAddress,
              args: [token],
              chainId,
            }}
          />
        )}
        <ActionButton
          label="Rescue ETH"
          onClick={() => emergencyRescue(ZERO_ADDR)}
          variant="outline"
          simulate={{
            abi: launchOrchestratorAbi,
            functionName: "emergencyRescue",
            contractAddress: launchAddress,
            args: [ZERO_ADDR],
            chainId,
          }}
        />
      </div>
    </div>
  );
}
