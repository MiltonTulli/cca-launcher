"use client";

import { useMemo } from "react";
import { type Address, formatUnits } from "viem";
import type {
  AuctionInfo,
  DistributionInfo,
  LaunchInfo,
  PreconditionCheck,
} from "@/components/launch-detail/types";
import { LaunchState, TokenSource } from "@/config/contracts";
import { BASIS_POINTS, formatCountdown, shortenAddress } from "@/lib/utils";

export interface UseLaunchPreconditionsInput {
  currentState: LaunchState;
  connectedAddress: Address | undefined;
  isOperator: boolean;
  launchInfo: LaunchInfo | undefined;
  tokenSourceValue: number | undefined;
  tokenAmountValue: bigint | undefined;
  orchestratorTokenBalance: bigint | undefined;
  operatorTokenAllowance: bigint | undefined;
  operatorTokenBalance: bigint | undefined;
  hasMinterRole: boolean | undefined;
  tokenLoading: boolean;
  auctionEndTimeValue: bigint | undefined;
  distributionDelayValue: bigint | undefined;
  distributionTimestampValue: bigint | undefined;
  auctionInfo: AuctionInfo | undefined;
  distInfo: DistributionInfo | undefined;
  ccaCurrencyRaised: bigint | undefined;
  pendingTreasuryPaymentValue: bigint | undefined;
  now: number;
}

export function useLaunchPreconditions(
  input: UseLaunchPreconditionsInput,
): Record<string, PreconditionCheck[]> {
  const {
    currentState,
    connectedAddress,
    isOperator,
    launchInfo,
    tokenSourceValue,
    tokenAmountValue,
    orchestratorTokenBalance,
    operatorTokenAllowance,
    operatorTokenBalance,
    hasMinterRole,
    tokenLoading,
    auctionEndTimeValue,
    distributionDelayValue,
    distributionTimestampValue,
    auctionInfo,
    distInfo,
    ccaCurrencyRaised,
    pendingTreasuryPaymentValue,
    now,
  } = input;

  return useMemo(() => {
    const map: Record<string, PreconditionCheck[]> = {};

    // --- finalizeSetup ---
    if (currentState === LaunchState.SETUP && connectedAddress) {
      const checks: PreconditionCheck[] = [
        {
          id: "is-operator",
          label: "Connected as operator",
          description: launchInfo?.operator
            ? `Operator: ${shortenAddress(launchInfo.operator)}`
            : "",
          met: isOperator,
        },
      ];

      if (tokenSourceValue === TokenSource.TRANSFER) {
        checks.push({
          id: "token-balance",
          label: "Tokens transferred to orchestrator",
          description:
            tokenAmountValue !== undefined && orchestratorTokenBalance !== undefined
              ? `Balance: ${formatUnits(orchestratorTokenBalance, 18)} / Required: ${formatUnits(tokenAmountValue, 18)}`
              : "Checking balance...",
          met: !!(
            orchestratorTokenBalance !== undefined &&
            tokenAmountValue !== undefined &&
            orchestratorTokenBalance >= tokenAmountValue
          ),
          loading: tokenLoading,
        });
      } else if (tokenSourceValue === TokenSource.TRANSFER_FROM) {
        checks.push({
          id: "token-allowance",
          label: "Operator has approved tokens",
          description:
            tokenAmountValue !== undefined && operatorTokenAllowance !== undefined
              ? `Allowance: ${formatUnits(operatorTokenAllowance, 18)} / Required: ${formatUnits(tokenAmountValue, 18)}`
              : "Checking allowance...",
          met: !!(
            operatorTokenAllowance !== undefined &&
            tokenAmountValue !== undefined &&
            operatorTokenAllowance >= tokenAmountValue
          ),
          loading: tokenLoading,
        });
      } else if (tokenSourceValue === TokenSource.MINT) {
        checks.push({
          id: "minter-role",
          label: "Orchestrator has minter role",
          description:
            hasMinterRole !== undefined
              ? hasMinterRole
                ? "MINTER_ROLE granted"
                : "MINTER_ROLE not granted on token"
              : "Checking role...",
          met: hasMinterRole === true,
          loading: hasMinterRole === undefined && tokenLoading,
        });
      }

      map.finalizeSetup = checks;
    }

    // --- startAuction ---
    if (currentState === LaunchState.FINALIZED && connectedAddress) {
      const startTimeVal = launchInfo?.startTime ? Number(launchInfo.startTime) : 0;
      const auctionSupply =
        tokenAmountValue && launchInfo
          ? tokenAmountValue - (tokenAmountValue * launchInfo.liquidityAllocation) / BASIS_POINTS
          : BigInt(0);

      const checks: PreconditionCheck[] = [
        {
          id: "is-operator",
          label: "Connected as operator",
          description: launchInfo?.operator
            ? `Operator: ${shortenAddress(launchInfo.operator)}`
            : "",
          met: isOperator,
        },
      ];

      if (startTimeVal > 0) {
        checks.push({
          id: "start-time",
          label: "Scheduled start time reached",
          description:
            now >= startTimeVal
              ? `Start time passed (${new Date(startTimeVal * 1000).toLocaleString()})`
              : `Starts in ${formatCountdown(startTimeVal - now)} (${new Date(startTimeVal * 1000).toLocaleString()})`,
          met: now >= startTimeVal,
        });
      }

      checks.push({
        id: "auction-supply",
        label: "Auction supply is positive",
        description:
          auctionSupply > BigInt(0)
            ? `${formatUnits(auctionSupply, 18)} tokens for auction`
            : "No tokens available for auction (100% allocated to liquidity)",
        met: auctionSupply > BigInt(0),
      });

      // Token readiness checks — startAuction actually transfers tokens
      if (tokenSourceValue === TokenSource.MINT) {
        checks.push({
          id: "minter-role",
          label: "Orchestrator has minter role",
          description:
            hasMinterRole !== undefined
              ? hasMinterRole
                ? "MINTER_ROLE granted — tokens will be minted on start"
                : "MINTER_ROLE not granted on token contract"
              : "Checking role...",
          met: hasMinterRole === true,
          loading: hasMinterRole === undefined && tokenLoading,
        });
      } else if (tokenSourceValue === TokenSource.TRANSFER_FROM) {
        // TRANSFER_FROM: needs both allowance and balance from operator
        checks.push({
          id: "token-allowance",
          label: "Operator has approved tokens",
          description:
            tokenAmountValue !== undefined && operatorTokenAllowance !== undefined
              ? `Allowance: ${formatUnits(operatorTokenAllowance, 18)} / Required: ${formatUnits(tokenAmountValue, 18)}`
              : "Checking allowance...",
          met: !!(
            operatorTokenAllowance !== undefined &&
            tokenAmountValue !== undefined &&
            operatorTokenAllowance >= tokenAmountValue
          ),
          loading: tokenLoading,
        });
        checks.push({
          id: "operator-balance",
          label: "Operator has sufficient token balance",
          description:
            tokenAmountValue !== undefined && operatorTokenBalance !== undefined
              ? `Balance: ${formatUnits(operatorTokenBalance, 18)} / Required: ${formatUnits(tokenAmountValue, 18)}`
              : "Checking balance...",
          met: !!(
            operatorTokenBalance !== undefined &&
            tokenAmountValue !== undefined &&
            operatorTokenBalance >= tokenAmountValue
          ),
          loading: tokenLoading,
        });
      } else if (tokenSourceValue === TokenSource.TRANSFER) {
        checks.push({
          id: "token-balance",
          label: "Tokens available in orchestrator",
          description:
            tokenAmountValue !== undefined && orchestratorTokenBalance !== undefined
              ? `Balance: ${formatUnits(orchestratorTokenBalance, 18)} / Required: ${formatUnits(tokenAmountValue, 18)}`
              : "Checking balance...",
          met: !!(
            orchestratorTokenBalance !== undefined &&
            tokenAmountValue !== undefined &&
            orchestratorTokenBalance >= tokenAmountValue
          ),
          loading: tokenLoading,
        });
      }

      map.startAuction = checks;
    }

    // --- distribution actions ---
    if (currentState === LaunchState.AUCTION_ACTIVE || currentState === LaunchState.AUCTION_ENDED) {
      const endTime = auctionEndTimeValue ? Number(auctionEndTimeValue) : 0;
      const delay = distributionDelayValue ? Number(distributionDelayValue) : 0;
      const auctionEnded = endTime > 0 && now >= endTime;
      const permissionlessTime = endTime + delay;
      const isPermissionlessNow = delay === 0 || now >= permissionlessTime;

      // distributeLiquidity / distributeAll
      const distChecks: PreconditionCheck[] = [
        {
          id: "auction-ended",
          label: "Auction has ended",
          description:
            endTime > 0
              ? auctionEnded
                ? `Ended at ${new Date(endTime * 1000).toLocaleString()}`
                : `Ends in ${formatCountdown(endTime - now)}`
              : "Auction end time not set",
          met: auctionEnded,
        },
      ];

      if (!isOperator && connectedAddress) {
        distChecks.push({
          id: "distribution-delay",
          label: "Distribution delay passed",
          description:
            delay === 0
              ? "No delay configured"
              : isPermissionlessNow
                ? "Delay passed — anyone can distribute"
                : `Permissionless in ${formatCountdown(permissionlessTime - now)}`,
          met: isPermissionlessNow,
        });
      }

      // Use CCA's currencyRaised (read directly from CCA contract) as source of truth,
      // falling back to orchestrator's totalRaised.
      const raised = ccaCurrencyRaised ?? auctionInfo?.totalRaised;
      distChecks.push({
        id: "has-bids",
        label: "Auction received bids",
        description:
          raised !== undefined
            ? `Currency raised: ${formatUnits(raised, 18)}`
            : "Loading auction info...",
        met: raised !== undefined && raised > BigInt(0),
      });

      map.distributeLiquidity = distChecks;
      map.distributeAll = distChecks;

      // distributeTreasury
      map.distributeTreasury = [
        ...distChecks,
        {
          id: "liquidity-complete",
          label: "Liquidity distributed first",
          description: distInfo?.liquidityComplete
            ? "Liquidity distribution complete"
            : "Distribute liquidity before treasury",
          met: distInfo?.liquidityComplete === true,
        },
      ];

      // finalizeFailedAuction
      const failedChecks: PreconditionCheck[] = [
        {
          id: "auction-ended",
          label: "Auction has ended",
          description:
            endTime > 0
              ? auctionEnded
                ? "Auction ended"
                : `Ends in ${formatCountdown(endTime - now)}`
              : "Auction end time not set",
          met: auctionEnded,
        },
        {
          id: "zero-bids",
          label: "Auction has zero bids",
          description:
            raised !== undefined
              ? raised === BigInt(0)
                ? "No bids received"
                : `Auction has bids (raised: ${formatUnits(raised, 18)})`
              : "Loading auction info...",
          met: raised !== undefined && raised === BigInt(0),
        },
      ];

      if (!isOperator && connectedAddress) {
        failedChecks.splice(1, 0, {
          id: "distribution-delay",
          label: "Distribution delay passed",
          description:
            delay === 0
              ? "No delay configured"
              : isPermissionlessNow
                ? "Delay passed"
                : `Wait ${formatCountdown(permissionlessTime - now)}`,
          met: isPermissionlessNow,
        });
      }

      map.finalizeFailedAuction = failedChecks;
    }

    // --- claimTreasuryPayment ---
    if (
      (currentState === LaunchState.DISTRIBUTED ||
        currentState === LaunchState.LOCKED ||
        currentState === LaunchState.UNLOCKED) &&
      connectedAddress
    ) {
      const hasPending =
        pendingTreasuryPaymentValue !== undefined && pendingTreasuryPaymentValue > BigInt(0);

      map.claimTreasuryPayment = [
        {
          id: "is-operator",
          label: "Connected as operator",
          description: launchInfo?.operator
            ? `Operator: ${shortenAddress(launchInfo.operator)}`
            : "",
          met: isOperator,
        },
        {
          id: "has-pending-payment",
          label: "Escrowed treasury payment exists",
          description:
            pendingTreasuryPaymentValue !== undefined
              ? hasPending
                ? `Pending: ${formatUnits(pendingTreasuryPaymentValue, 18)}`
                : "No escrowed payment"
              : "Loading...",
          met: hasPending,
        },
      ];
    }

    // --- withdrawPosition ---
    if (currentState === LaunchState.LOCKED && connectedAddress) {
      const distTs = distributionTimestampValue ? Number(distributionTimestampValue) : 0;
      const lockDur = launchInfo?.lockupDuration ? Number(launchInfo.lockupDuration) : 0;
      const unlockTime = distTs + lockDur;

      map.withdrawPosition = [
        {
          id: "is-operator",
          label: "Connected as operator",
          description: "",
          met: isOperator,
        },
        {
          id: "lockup-expired",
          label: "Lockup period expired",
          description:
            unlockTime > 0
              ? now >= unlockTime
                ? "Lockup expired — position can be withdrawn"
                : `Unlocks in ${formatCountdown(unlockTime - now)}`
              : "No lockup configured",
          met: unlockTime === 0 || now >= unlockTime,
        },
      ];
    }

    return map;
  }, [
    currentState,
    connectedAddress,
    isOperator,
    launchInfo,
    tokenSourceValue,
    tokenAmountValue,
    orchestratorTokenBalance,
    operatorTokenAllowance,
    operatorTokenBalance,
    hasMinterRole,
    tokenLoading,
    auctionEndTimeValue,
    distributionDelayValue,
    distributionTimestampValue,
    auctionInfo,
    distInfo,
    ccaCurrencyRaised,
    pendingTreasuryPaymentValue,
    now,
  ]);
}
