"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Address, encodeFunctionData, formatUnits, isAddress } from "viem";
import {
  useAccount,
  useChainId,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  TALLY_LAUNCH_ORCHESTRATOR_ABI,
  ERC20_ABI,
  ACCESS_CONTROL_ABI,
  MINTER_ROLE,
  LaunchState,
  TokenSource,
  LAUNCH_STATE_LABELS,
  LAUNCH_STATE_COLORS,
} from "@/config/contracts";
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRightLeft,
  Shield,
  Info,
  FlaskConical,
  FileText,
} from "lucide-react";
import {
  simulateTransaction,
  type SimulationResult,
} from "@/lib/simulate";
import { ShareBar } from "@/components/ShareBar";
import { CommentsSection } from "@/components/CommentsSection";
import { getDraftForLaunch } from "@/lib/launch-draft";
import Link from "next/link";

// ============================================
// Types
// ============================================
interface LaunchDetailProps {
  address: Address;
}

interface LaunchInfo {
  launchId: bigint;
  launcher: Address;
  token: Address;
  paymentToken: Address;
  operator: Address;
  treasury: Address;
  state: number;
  auctionDuration: bigint;
  pricingSteps: bigint;
  reservePrice: bigint;
  startTime: bigint;
  liquidityAllocation: bigint;
  treasuryAllocation: bigint;
  poolFeeTier: number;
  tickSpacing: number;
  lockupDuration: bigint;
  unlockTime: bigint;
  positionBeneficiary: Address;
  platformFeeOnLPFees: bigint;
}

interface DistributionInfo {
  totalRaised: bigint;
  tokensSold: bigint;
  treasuryPaid: bigint;
  liquidityCreated: bigint;
  liquidityComplete: boolean;
  treasuryComplete: boolean;
  cca: Address;
  lockupContract: Address;
  positionTokenId: bigint;
}

interface AuctionInfo {
  cca: Address;
  startTime: bigint;
  endTime: bigint;
  currentPrice: bigint;
  reservePrice: bigint;
  tokensSold: bigint;
  totalRaised: bigint;
  isActive: boolean;
  hasEnded: boolean;
}

interface PreconditionCheck {
  id: string;
  label: string;
  description: string;
  met: boolean;
  loading?: boolean;
}

// ============================================
// Explorer URLs
// ============================================
const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  8453: "https://basescan.org",
  84532: "https://sepolia.basescan.org",
};

// ============================================
// Helpers
// ============================================
function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Ended";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

function formatBps(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

function formatDuration(seconds: bigint): string {
  const s = Number(seconds);
  if (s === 0) return "None";
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  const mins = Math.floor((s % 3600) / 60);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BASIS_POINTS = BigInt(10000);

// ============================================
// Precondition Checklist Component
// ============================================
function PreconditionChecklist({
  checks,
  action,
}: {
  checks: PreconditionCheck[];
  action: string;
}) {
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

// ============================================
// Action Button Component
// ============================================
function ActionButton({
  label,
  functionName,
  contractAddress,
  args,
  gas,
  disabled,
  variant = "default",
  onSuccess,
  simulatable,
}: {
  label: string;
  functionName: string;
  contractAddress: Address;
  args?: readonly unknown[];
  gas?: bigint;
  disabled?: boolean;
  variant?: "default" | "outline" | "destructive";
  onSuccess?: () => void;
  simulatable?: boolean;
}) {
  const { address: from } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
      const timer = setTimeout(() => reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess, reset]);

  const handleClick = () => {
    reset();
    writeContract({
      address: contractAddress,
      abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
      functionName: functionName as never,
      ...(args ? { args: args as never } : {}),
      ...(gas ? { gas } : {}),
    });
  };

  const handleSimulate = async () => {
    if (!from) return;
    setSimulating(true);
    setSimResult(null);
    setSimError(null);

    try {
      const input = encodeFunctionData({
        abi: TALLY_LAUNCH_ORCHESTRATOR_ABI,
        functionName: functionName as never,
        ...(args ? { args: args as never } : {}),
      });

      const result = await simulateTransaction({
        from,
        to: contractAddress,
        input,
        networkId: chainId,
        gas: gas ? Number(gas) : undefined,
      });

      setSimResult(result);
    } catch (err) {
      setSimError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        disabled={disabled || isPending || isConfirming}
        onClick={handleClick}
        className="w-full"
      >
        {isPending || isConfirming ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            {isPending ? "Confirm in wallet..." : "Confirming..."}
          </span>
        ) : isSuccess ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Success
          </span>
        ) : (
          label
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-600" title={error.message}>
          {error.message.includes("User rejected")
            ? "Transaction rejected"
            : (() => {
                const revertMatch = error.message.match(/reason:\s*(.+?)(?:\n|$)/);
                const solidityMatch = error.message.match(/reverted with custom error '([^']+)'/);
                const shortMessage = error.message.match(/Details:\s*(.+?)(?:\n|$)/);
                const reason = revertMatch?.[1] || solidityMatch?.[1] || shortMessage?.[1];
                if (reason) return reason.trim();
                return error.message.length > 120
                  ? error.message.slice(0, 120) + "..."
                  : error.message;
              })()}
        </p>
      )}
      {simulatable && from && (
        <div className="mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSimulate}
            disabled={simulating || disabled}
            className="w-full"
          >
            {simulating ? (
              <>
                <Spinner size="sm" />
                Simulating...
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4" />
                Simulate with Tenderly
              </>
            )}
          </Button>
          {simResult && (
            <div
              className={`mt-1.5 text-xs rounded-lg border p-2.5 ${
                simResult.success
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium flex items-center gap-1">
                  {simResult.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  {simResult.success ? "Simulation passed" : "Simulation failed"}
                </span>
                {simResult.gasUsed > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    Gas: {simResult.gasUsed.toLocaleString()}
                  </span>
                )}
              </div>
              {simResult.error && (
                <p className="mt-1 text-[11px] leading-tight">{simResult.error}</p>
              )}
              <a
                href={simResult.simulationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[11px] underline hover:no-underline"
              >
                View in Tenderly
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
          {simError && (
            <p className="mt-1 text-xs text-red-600">{simError}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export function LaunchDetail({ address }: LaunchDetailProps) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const explorerUrl = EXPLORER_URLS[chainId] || "https://etherscan.io";
  const [transferTo, setTransferTo] = useState("");
  const [newLiquidityManager, setNewLiquidityManager] = useState("");
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [linkedDraftId, setLinkedDraftId] = useState<string | null>(null);

  // Tick every second for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load linked draft ID
  useEffect(() => {
    getDraftForLaunch(address).then(setLinkedDraftId).catch(() => {});
  }, [address]);

  // ============================================
  // Primary Multicall: orchestrator data
  // ============================================
  const contractBase = { address, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI } as const;

  const {
    data: results,
    isLoading,
    isError,
    refetch,
  } = useReadContracts({
    contracts: [
      { ...contractBase, functionName: "getLaunchInfo" },               // [0]
      { ...contractBase, functionName: "getDistributionState" },        // [1]
      { ...contractBase, functionName: "getAuctionInfo" },              // [2]
      { ...contractBase, functionName: "isDistributionPermissionless" },// [3]
      { ...contractBase, functionName: "isUnlocked" },                  // [4]
      { ...contractBase, functionName: "pendingOperator" },             // [5]
      { ...contractBase, functionName: "state" },                       // [6]
      { ...contractBase, functionName: "tokenSource" },                 // [7]
      { ...contractBase, functionName: "tokenAmount" },                 // [8]
      { ...contractBase, functionName: "auctionEndTime" },              // [9]
      { ...contractBase, functionName: "distributionDelay" },           // [10]
      { ...contractBase, functionName: "distributionTimestamp" },        // [11]
      { ...contractBase, functionName: "liquidityManager" },            // [12]
    ],
    query: {
      refetchInterval: 15000,
    },
  });

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // Parse primary results
  const launchInfo = results?.[0]?.result as LaunchInfo | undefined;
  const distInfo = results?.[1]?.result as DistributionInfo | undefined;
  const auctionInfo = results?.[2]?.result as AuctionInfo | undefined;
  const isPermissionless = results?.[3]?.result as boolean | undefined;
  const unlocked = results?.[4]?.result as boolean | undefined;
  const pendingOp = results?.[5]?.result as Address | undefined;
  const directState = results?.[6]?.result as number | undefined;
  const tokenSourceValue = results?.[7]?.result as number | undefined;
  const tokenAmountValue = results?.[8]?.result as bigint | undefined;
  const auctionEndTimeValue = results?.[9]?.result as bigint | undefined;
  const distributionDelayValue = results?.[10]?.result as bigint | undefined;
  const distributionTimestampValue = results?.[11]?.result as bigint | undefined;
  const liquidityManagerValue = results?.[12]?.result as Address | undefined;

  // Derived values
  const currentState = (directState ?? launchInfo?.state ?? 0) as LaunchState;
  const isOperator =
    !!connectedAddress &&
    !!launchInfo?.operator &&
    connectedAddress.toLowerCase() === launchInfo.operator.toLowerCase();
  const isPendingOperator =
    !!connectedAddress &&
    !!pendingOp &&
    pendingOp !== ZERO_ADDRESS &&
    connectedAddress.toLowerCase() === pendingOp.toLowerCase();
  const auctionTimeElapsed =
    currentState === LaunchState.AUCTION_ACTIVE &&
    auctionEndTimeValue !== undefined &&
    Number(auctionEndTimeValue) > 0 &&
    now >= Number(auctionEndTimeValue);

  // ============================================
  // Secondary Multicall: token balance/allowance/role
  // ============================================
  const tokenAddress = launchInfo?.token;
  const operatorAddress = launchInfo?.operator;

  const tokenContracts = useMemo(() => {
    if (!tokenAddress || !operatorAddress) return [];
    const contracts: {
      address: Address;
      abi: typeof ERC20_ABI | typeof ACCESS_CONTROL_ABI;
      functionName: string;
      args: readonly unknown[];
    }[] = [
      // [0] Token balance of orchestrator
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      },
      // [1] Token allowance from operator to orchestrator
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [operatorAddress, address],
      },
      // [2] hasRole(MINTER_ROLE, orchestrator) — may fail if token doesn't implement AccessControl
      {
        address: tokenAddress,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [MINTER_ROLE, address],
      },
      // [3] Token balance of operator (for TRANSFER_FROM check in startAuction)
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [operatorAddress],
      },
    ];
    return contracts;
  }, [tokenAddress, operatorAddress, address]);

  const { data: tokenResults, isLoading: tokenLoading } = useReadContracts({
    contracts: tokenContracts as never,
    query: {
      enabled: tokenContracts.length > 0,
      refetchInterval: 15000,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tr = tokenResults as any[] | undefined;
  const orchestratorTokenBalance = tr?.[0]?.result as bigint | undefined;
  const operatorTokenAllowance = tr?.[1]?.result as bigint | undefined;
  const hasMinterRole = tr?.[2]?.status === "success"
    ? (tr[2].result as boolean)
    : undefined;
  const operatorTokenBalance = tr?.[3]?.result as bigint | undefined;

  // ============================================
  // Precondition computation
  // ============================================
  const preconditionsByAction = useMemo(() => {
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
      } else if (tokenSourceValue === TokenSource.PERMIT2) {
        // PERMIT2 / TRANSFER_FROM
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

      map["finalizeSetup"] = checks;
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
      } else if (tokenSourceValue === TokenSource.PERMIT2) {
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

      map["startAuction"] = checks;
    }

    // --- distribution actions ---
    if (
      currentState === LaunchState.AUCTION_ACTIVE ||
      currentState === LaunchState.AUCTION_ENDED
    ) {
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

      distChecks.push({
        id: "has-bids",
        label: "Auction received bids",
        description: auctionInfo
          ? `Total raised: ${formatUnits(auctionInfo.totalRaised, 18)}`
          : "Loading auction info...",
        met: !!(auctionInfo && auctionInfo.totalRaised > BigInt(0)),
      });

      map["distributeLiquidity"] = distChecks;
      map["distributeAll"] = distChecks;

      // distributeTreasury
      map["distributeTreasury"] = [
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
          description: auctionInfo
            ? auctionInfo.totalRaised === BigInt(0)
              ? "No bids received"
              : `Auction has bids (raised: ${formatUnits(auctionInfo.totalRaised, 18)})`
            : "Loading auction info...",
          met: !!(auctionInfo && auctionInfo.totalRaised === BigInt(0)),
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

      map["finalizeFailedAuction"] = failedChecks;
    }

    // --- withdrawPosition ---
    if (currentState === LaunchState.LOCKED && connectedAddress) {
      const distTs = distributionTimestampValue ? Number(distributionTimestampValue) : 0;
      const lockDur = launchInfo?.lockupDuration ? Number(launchInfo.lockupDuration) : 0;
      const unlockTime = distTs + lockDur;

      map["withdrawPosition"] = [
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
    now,
  ]);

  // ============================================
  // Loading state
  // ============================================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading launch data...</p>
      </div>
    );
  }

  // Error state
  if (isError || !launchInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load launch</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm text-center">
          Could not read data from the orchestrator at this address. It may not be a valid
          orchestrator contract.
        </p>
        <Button variant="outline" onClick={handleRefetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // ============================================
  // Section A: Header
  // ============================================
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">Launch #{launchInfo.launchId.toString()}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LAUNCH_STATE_COLORS[currentState]}`}
          >
            {LAUNCH_STATE_LABELS[currentState]}
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
            href={`/draft/${linkedDraftId}`}
            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-700 bg-blue-100 rounded-full px-2.5 py-0.5 hover:bg-blue-200 transition-colors"
          >
            <FileText className="h-3 w-3" />
            Created from draft
          </Link>
        )}
        <div className="mt-2">
          <ShareBar
            url={typeof window !== "undefined" ? `${window.location.origin}/launch/${address}` : ""}
            text={`Check out Launch #${launchInfo.launchId.toString()} on Tally Launch`}
          />
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={handleRefetch}>
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
    </div>
  );

  // ============================================
  // Section B: Launch Info Card
  // ============================================
  const renderLaunchInfo = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Launch Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium">State</span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${LAUNCH_STATE_COLORS[currentState]}`}
            >
              {LAUNCH_STATE_LABELS[currentState]}
            </span>
          </div>
          <InfoRow label="Token" value={launchInfo.token} isAddress explorerUrl={explorerUrl} />
          <InfoRow
            label="Payment Token"
            value={launchInfo.paymentToken}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Operator"
            value={launchInfo.operator}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Treasury"
            value={launchInfo.treasury}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Beneficiary"
            value={launchInfo.positionBeneficiary}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Launcher"
            value={launchInfo.launcher}
            isAddress
            explorerUrl={explorerUrl}
          />
          <InfoRow
            label="Liquidity Allocation"
            value={formatBps(launchInfo.liquidityAllocation)}
          />
          <InfoRow
            label="Treasury Allocation"
            value={formatBps(launchInfo.treasuryAllocation)}
          />
          <InfoRow
            label="Pool Fee Tier"
            value={`${(launchInfo.poolFeeTier / 10000).toFixed(2)}%`}
          />
          <InfoRow label="Tick Spacing" value={launchInfo.tickSpacing.toString()} />
          <InfoRow
            label="Auction Duration"
            value={formatDuration(launchInfo.auctionDuration)}
          />
          <InfoRow label="Pricing Steps" value={launchInfo.pricingSteps.toString()} />
          <InfoRow label="Reserve Price" value={formatUnits(launchInfo.reservePrice, 18)} />
          <InfoRow
            label="Lockup Duration"
            value={formatDuration(launchInfo.lockupDuration)}
          />
          <InfoRow
            label="Platform Fee on LP"
            value={formatBps(launchInfo.platformFeeOnLPFees)}
          />
          {launchInfo.unlockTime > BigInt(0) && (
            <InfoRow
              label="Unlock Time"
              value={new Date(Number(launchInfo.unlockTime) * 1000).toLocaleString()}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ============================================
  // Section C: Auction Info Card
  // ============================================
  const renderAuctionInfo = () => {
    if (currentState < LaunchState.AUCTION_ACTIVE || !auctionInfo) return null;

    const endTime = Number(auctionInfo.endTime);
    const timeRemaining = endTime > now ? endTime - now : 0;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Auction Status
            {auctionInfo.isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                <Clock className="h-3 w-3" />
                Live
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {auctionInfo.isActive && (
              <div className="sm:col-span-2 rounded-lg bg-primary/5 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                <p className="text-2xl font-bold font-mono">
                  {formatCountdown(timeRemaining)}
                </p>
              </div>
            )}
            <InfoRow
              label="CCA Contract"
              value={auctionInfo.cca}
              isAddress
              explorerUrl={explorerUrl}
            />
            <InfoRow
              label="Start Time"
              value={
                Number(auctionInfo.startTime) > 0
                  ? new Date(Number(auctionInfo.startTime) * 1000).toLocaleString()
                  : "Not started"
              }
            />
            <InfoRow
              label="End Time"
              value={
                Number(auctionInfo.endTime) > 0
                  ? new Date(Number(auctionInfo.endTime) * 1000).toLocaleString()
                  : "N/A"
              }
            />
            <InfoRow
              label="Current Price"
              value={formatUnits(auctionInfo.currentPrice, 18)}
            />
            <InfoRow
              label="Reserve Price"
              value={formatUnits(auctionInfo.reservePrice, 18)}
            />
            <InfoRow label="Tokens Sold" value={formatUnits(auctionInfo.tokensSold, 18)} />
            <InfoRow label="Total Raised" value={formatUnits(auctionInfo.totalRaised, 18)} />
            <InfoRow label="Has Ended" value={auctionInfo.hasEnded ? "Yes" : "No"} />
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Section D: Distribution Info Card
  // ============================================
  const renderDistributionInfo = () => {
    if (currentState < LaunchState.AUCTION_ENDED || !distInfo) return null;

    const unlockTime = Number(launchInfo.unlockTime);
    const unlockRemaining = unlockTime > now ? unlockTime - now : 0;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Total Raised" value={formatUnits(distInfo.totalRaised, 18)} />
            <InfoRow label="Tokens Sold" value={formatUnits(distInfo.tokensSold, 18)} />
            <InfoRow label="Treasury Paid" value={formatUnits(distInfo.treasuryPaid, 18)} />
            <InfoRow
              label="Liquidity Created"
              value={formatUnits(distInfo.liquidityCreated, 18)}
            />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Liquidity Complete</span>
              {distInfo.liquidityComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Treasury Complete</span>
              {distInfo.treasuryComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {distInfo.lockupContract !== ZERO_ADDRESS && (
              <InfoRow
                label="Lockup Contract"
                value={distInfo.lockupContract}
                isAddress
                explorerUrl={explorerUrl}
              />
            )}
            {distInfo.positionTokenId > BigInt(0) && (
              <InfoRow
                label="Position Token ID"
                value={distInfo.positionTokenId.toString()}
              />
            )}
            {unlockTime > 0 && currentState === LaunchState.LOCKED && (
              <div className="sm:col-span-2 rounded-lg bg-orange-50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Unlock In</p>
                <p className="text-xl font-bold font-mono">
                  {unlockRemaining > 0
                    ? formatCountdown(unlockRemaining)
                    : "Unlockable now"}
                </p>
              </div>
            )}
            {isPermissionless !== undefined && (
              <InfoRow
                label="Permissionless Distribution"
                value={isPermissionless ? "Yes" : "No"}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Section E: Actions Panel
  // ============================================
  const renderActions = () => {
    const sections: React.ReactElement[] = [];

    // SETUP → Finalize Setup
    if (connectedAddress && currentState === LaunchState.SETUP) {
      sections.push(
        <div key="finalize-setup" className="space-y-2">
          {preconditionsByAction["finalizeSetup"] && (
            <PreconditionChecklist
              checks={preconditionsByAction["finalizeSetup"]}
              action="Finalize Setup"
            />
          )}
          <ActionButton
            disabled={!isOperator}
            label="Finalize Setup"
            functionName="finalizeSetup"
            contractAddress={address}
            onSuccess={handleRefetch}
            simulatable
          />
        </div>
      );
    }

    // FINALIZED → Start Auction
    if (connectedAddress && currentState === LaunchState.FINALIZED) {
      sections.push(
        <div key="start-auction" className="space-y-2">
          {preconditionsByAction["startAuction"] && (
            <PreconditionChecklist
              checks={preconditionsByAction["startAuction"]}
              action="Start Auction"
            />
          )}
          <ActionButton
            disabled={!isOperator}
            label="Start Auction"
            functionName="startAuction"
            contractAddress={address}
            gas={BigInt(15_000_000)}
            onSuccess={handleRefetch}
            simulatable
          />
        </div>
      );
    }

    // AUCTION_ENDED (or AUCTION_ACTIVE with time elapsed) → distribution actions
    if (currentState === LaunchState.AUCTION_ENDED || auctionTimeElapsed) {
      const canAct = isOperator || isPermissionless;

      if (canAct) {
        sections.push(
          <div key="distribute-group" className="space-y-3">
            {preconditionsByAction["distributeAll"] && (
              <PreconditionChecklist
                checks={preconditionsByAction["distributeAll"]}
                action="Distribution"
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionButton
                label="Distribute All"
                functionName="distributeAll"
                contractAddress={address}
                onSuccess={handleRefetch}
              />
              <ActionButton
                label="Distribute Liquidity"
                functionName="distributeLiquidity"
                contractAddress={address}
                variant="outline"
                onSuccess={handleRefetch}
              />
            </div>
            {preconditionsByAction["distributeTreasury"] && (
              <PreconditionChecklist
                checks={[
                  preconditionsByAction["distributeTreasury"].find(
                    (c) => c.id === "liquidity-complete"
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
              onSuccess={handleRefetch}
            />
          </div>
        );
      }

      // Finalize failed auction
      sections.push(
        <div key="finalize-failed" className="space-y-2">
          {preconditionsByAction["finalizeFailedAuction"] && (
            <PreconditionChecklist
              checks={preconditionsByAction["finalizeFailedAuction"]}
              action="Finalize Failed Auction"
            />
          )}
          <ActionButton
            label="Finalize Failed Auction"
            functionName="finalizeFailedAuction"
            contractAddress={address}
            variant="destructive"
            onSuccess={handleRefetch}
          />
        </div>
      );
    }

    // DISTRIBUTED / LOCKED / UNLOCKED → sweep + withdraw
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
              onSuccess={handleRefetch}
            />
            <ActionButton
              label="Sweep Payment Token"
              functionName="sweepPaymentToken"
              contractAddress={address}
              variant="outline"
              onSuccess={handleRefetch}
            />
          </div>
        );
      }
      if (currentState === LaunchState.LOCKED && connectedAddress) {
        sections.push(
          <div key="withdraw-position" className="space-y-2">
            {preconditionsByAction["withdrawPosition"] && (
              <PreconditionChecklist
                checks={preconditionsByAction["withdrawPosition"]}
                action="Withdraw Position"
              />
            )}
            <ActionButton
              disabled={!isOperator}
              label="Withdraw Position"
              functionName="withdrawPosition"
              contractAddress={address}
              onSuccess={handleRefetch}
            />
          </div>
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
                <appkit-button balance="hide" />
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
          <div className="space-y-4">{sections}</div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Section F: Operator Management
  // ============================================
  const renderOperatorManagement = () => {
    if (!isOperator && !isPendingOperator) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Operator Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOperator && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Transfer Operator Role</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="New operator address (0x...)"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <ActionButton
                    label="Transfer"
                    functionName="transferOperator"
                    contractAddress={address}
                    args={[transferTo as Address]}
                    disabled={!isAddress(transferTo)}
                    variant="outline"
                    onSuccess={() => {
                      setTransferTo("");
                      handleRefetch();
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Update Liquidity Manager</label>
                {liquidityManagerValue && liquidityManagerValue !== ZERO_ADDRESS && (
                  <p className="text-xs text-muted-foreground">
                    Current: <span className="font-mono">{shortenAddress(liquidityManagerValue)}</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="New liquidity manager address (0x...)"
                    value={newLiquidityManager}
                    onChange={(e) => setNewLiquidityManager(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <ActionButton
                    label="Update"
                    functionName="updateLiquidityManager"
                    contractAddress={address}
                    args={[newLiquidityManager as Address]}
                    disabled={!isAddress(newLiquidityManager)}
                    variant="outline"
                    onSuccess={() => {
                      setNewLiquidityManager("");
                      handleRefetch();
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {pendingOp && pendingOp !== ZERO_ADDRESS && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800 mb-1">
                Pending Operator Transfer
              </p>
              <p className="text-xs font-mono text-amber-700">{pendingOp}</p>
            </div>
          )}

          {isPendingOperator && (
            <ActionButton
              label="Accept Operator Role"
              functionName="acceptOperator"
              contractAddress={address}
              onSuccess={handleRefetch}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderLaunchInfo()}
      {renderAuctionInfo()}
      {renderDistributionInfo()}
      {renderActions()}
      {renderOperatorManagement()}
      <CommentsSection resourceType="launch" resourceId={address} />
    </div>
  );
}

// ============================================
// Info Row Helper
// ============================================
function InfoRow({
  label,
  value,
  isAddress: isAddr,
  explorerUrl,
}: {
  label: string;
  value: string;
  isAddress?: boolean;
  explorerUrl?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      {isAddr && explorerUrl ? (
        <a
          href={`${explorerUrl}/address/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono text-xs text-primary hover:underline truncate"
        >
          {shortenAddress(value)}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <span className="font-mono text-xs truncate">{value}</span>
      )}
    </div>
  );
}
