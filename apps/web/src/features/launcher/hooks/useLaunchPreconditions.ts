"use client";

import { useAccount, useBlockNumber, useReadContracts, useChainId } from "wagmi";
import { LaunchState, TokenSource, launchOrchestratorAbi } from "@launcher/sdk";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { useMemo } from "react";
import type { LaunchData } from "../utils/fromLaunchData";

export interface PreconditionCheck {
  id: string;
  label: string;
  description: string;
  met: boolean;
  loading?: boolean;
}

export type ActionPreconditions = Record<string, PreconditionCheck[]>;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function useLaunchPreconditions(
  launchData: LaunchData | undefined,
  launchAddress?: Address,
  overrideChainId?: number,
) {
  const { address: userAddress } = useAccount();
  const connectedChainId = useChainId();
  const chainId = overrideChainId ?? connectedChainId;
  const { data: blockNumber } = useBlockNumber({ chainId, watch: true });

  // Read token balances/allowances for precondition checks
  const tokenChecks = useMemo(() => {
    if (!launchData || !launchAddress || !userAddress) return [];
    const token = launchData.token;
    if (!token || token === ZERO_ADDRESS) return [];

    return [
      // Token balance of orchestrator
      { address: token as Address, abi: erc20Abi, functionName: "balanceOf" as const, args: [launchAddress] as const, chainId },
      // Token allowance from operator to orchestrator
      { address: token as Address, abi: erc20Abi, functionName: "allowance" as const, args: [userAddress, launchAddress] as const, chainId },
      // Operator token balance
      { address: token as Address, abi: erc20Abi, functionName: "balanceOf" as const, args: [userAddress] as const, chainId },
    ];
  }, [launchData, launchAddress, userAddress, chainId]);

  const { data: tokenResults, isLoading: tokenLoading } = useReadContracts({
    contracts: tokenChecks,
    query: { enabled: tokenChecks.length > 0 },
  });

  const orchestratorBalance = tokenResults?.[0]?.result as bigint | undefined;
  const operatorAllowance = tokenResults?.[1]?.result as bigint | undefined;
  const operatorBalance = tokenResults?.[2]?.result as bigint | undefined;

  const preconditions: ActionPreconditions = useMemo(() => {
    if (!launchData || !userAddress) return {};

    const isOperator = userAddress.toLowerCase() === launchData.operator.toLowerCase();
    const totalRequired = launchData.auctionTokenAmount + launchData.liquidityTokenAmount;

    const result: ActionPreconditions = {};

    // === CREATE TOKEN (SETUP + CREATE_NEW) ===
    if (launchData.state === LaunchState.SETUP && launchData.tokenSource === TokenSource.CREATE_NEW) {
      const tokenCreated = launchData.token !== ZERO_ADDRESS;
      result.createToken = [
        { id: "is-operator", label: "Is operator", description: isOperator ? "You are the operator" : "Only the operator can create the token", met: isOperator },
        { id: "token-not-created", label: "Token not yet created", description: tokenCreated ? "Token already created" : "Token needs to be created", met: !tokenCreated },
      ];
    }

    // === FINALIZE SETUP (SETUP) ===
    if (launchData.state === LaunchState.SETUP) {
      const checks: PreconditionCheck[] = [
        { id: "is-operator", label: "Is operator", description: isOperator ? "You are the operator" : "Only the operator can finalize", met: isOperator },
      ];

      if (launchData.tokenSource === TokenSource.CREATE_NEW) {
        const tokenCreated = launchData.token !== ZERO_ADDRESS;
        checks.push({ id: "token-created", label: "Token created", description: tokenCreated ? "Token is ready" : "Create the token first", met: tokenCreated });
      } else if (launchData.tokenSource === TokenSource.EXISTING_BALANCE) {
        const hasSufficientBalance = orchestratorBalance !== undefined && orchestratorBalance >= totalRequired;
        checks.push({
          id: "token-balance",
          label: "Sufficient token balance in orchestrator",
          description: hasSufficientBalance ? "Orchestrator has enough tokens" : `Orchestrator needs ${totalRequired} tokens`,
          met: hasSufficientBalance ?? false,
          loading: tokenLoading,
        });
      } else if (launchData.tokenSource === TokenSource.EXISTING_TRANSFER_FROM) {
        const hasSufficientAllowance = operatorAllowance !== undefined && operatorAllowance >= totalRequired;
        const hasSufficientBalance = operatorBalance !== undefined && operatorBalance >= totalRequired;
        checks.push(
          {
            id: "token-allowance",
            label: "Sufficient token allowance",
            description: hasSufficientAllowance ? "Allowance is sufficient" : `Approve ${totalRequired} tokens to orchestrator`,
            met: hasSufficientAllowance ?? false,
            loading: tokenLoading,
          },
          {
            id: "token-balance",
            label: "Sufficient operator token balance",
            description: hasSufficientBalance ? "Operator has enough tokens" : `Operator needs ${totalRequired} tokens`,
            met: hasSufficientBalance ?? false,
            loading: tokenLoading,
          },
        );
      }

      result.finalizeSetup = checks;
    }

    // === CANCEL (SETUP) ===
    if (launchData.state === LaunchState.SETUP) {
      result.cancel = [
        { id: "is-operator", label: "Is operator", description: isOperator ? "You are the operator" : "Only the operator can cancel", met: isOperator },
      ];
    }

    // === SETTLE AUCTION (FINALIZED + past endBlock) ===
    if (launchData.state === LaunchState.FINALIZED && blockNumber !== undefined) {
      const pastEndBlock = blockNumber > launchData.auctionEndBlockConfig;
      result.settleAuction = [
        { id: "auction-ended", label: "Auction period ended", description: pastEndBlock ? "Auction has ended" : `Auction ends at block ${launchData.auctionEndBlockConfig}`, met: pastEndBlock },
      ];
    }

    // === PROCESS DISTRIBUTION (AUCTION_ENDED) ===
    if (launchData.state === LaunchState.AUCTION_ENDED && blockNumber !== undefined) {
      const permissionlessBlock = launchData.auctionEndBlock + launchData.permissionlessDistributionDelay;
      const isPermissionless = blockNumber >= permissionlessBlock;
      const canDistribute = isOperator || isPermissionless;

      result.processDistribution = [
        {
          id: "can-distribute",
          label: canDistribute ? "Distribution enabled" : "Waiting for permissionless window",
          description: isOperator
            ? "You are the operator — can distribute anytime"
            : isPermissionless
              ? "Permissionless distribution is enabled"
              : `Permissionless distribution available at block ${permissionlessBlock} (${permissionlessBlock - blockNumber} blocks remaining)`,
          met: canDistribute,
        },
      ];
    }

    return result;
  }, [launchData, userAddress, blockNumber, orchestratorBalance, operatorAllowance, operatorBalance, tokenLoading]);

  return preconditions;
}
