"use client";

import { useState, useEffect, useCallback } from "react";
import { Address, formatUnits, isAddress } from "viem";
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
  LaunchState,
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
} from "lucide-react";

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

// ============================================
// Action Button Component
// ============================================
function ActionButton({
  label,
  functionName,
  contractAddress,
  args,
  disabled,
  variant = "default",
  onSuccess,
}: {
  label: string;
  functionName: string;
  contractAddress: Address;
  args?: readonly unknown[];
  disabled?: boolean;
  variant?: "default" | "outline" | "destructive";
  onSuccess?: () => void;
}) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
      // Reset the mutation state after success so the button returns to normal
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
      args: args as never,
    });
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
        <p className="text-xs text-red-600 truncate" title={error.message}>
          {error.message.includes("User rejected")
            ? "Transaction rejected"
            : error.message.length > 80
              ? error.message.slice(0, 80) + "..."
              : error.message}
        </p>
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
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Tick every second for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // Multicall: fetch all data in one batch
  const contractBase = { address, abi: TALLY_LAUNCH_ORCHESTRATOR_ABI } as const;

  const {
    data: results,
    isLoading,
    isError,
    refetch,
  } = useReadContracts({
    contracts: [
      { ...contractBase, functionName: "getLaunchInfo" },
      { ...contractBase, functionName: "getDistributionState" },
      { ...contractBase, functionName: "getAuctionInfo" },
      { ...contractBase, functionName: "isDistributionPermissionless" },
      { ...contractBase, functionName: "isUnlocked" },
      { ...contractBase, functionName: "pendingOperator" },
      { ...contractBase, functionName: "state" },
    ],
    query: {
      refetchInterval: 15000,
    },
  });

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // Parse results
  const launchInfo = results?.[0]?.result as LaunchInfo | undefined;
  const distInfo = results?.[1]?.result as DistributionInfo | undefined;
  const auctionInfo = results?.[2]?.result as AuctionInfo | undefined;
  const isPermissionless = results?.[3]?.result as boolean | undefined;
  const unlocked = results?.[4]?.result as boolean | undefined;
  const pendingOp = results?.[5]?.result as Address | undefined;
  const directState = results?.[6]?.result as number | undefined;

  // Use direct state() getter as primary (more reliable), fallback to getLaunchInfo struct
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

  // Loading state
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
          Could not read data from the orchestrator at this address. It may not be a valid orchestrator contract.
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
          <InfoRow label="Payment Token" value={launchInfo.paymentToken} isAddress explorerUrl={explorerUrl} />
          <InfoRow label="Operator" value={launchInfo.operator} isAddress explorerUrl={explorerUrl} />
          <InfoRow label="Treasury" value={launchInfo.treasury} isAddress explorerUrl={explorerUrl} />
          <InfoRow label="Beneficiary" value={launchInfo.positionBeneficiary} isAddress explorerUrl={explorerUrl} />
          <InfoRow label="Launcher" value={launchInfo.launcher} isAddress explorerUrl={explorerUrl} />
          <InfoRow label="Liquidity Allocation" value={formatBps(launchInfo.liquidityAllocation)} />
          <InfoRow label="Treasury Allocation" value={formatBps(launchInfo.treasuryAllocation)} />
          <InfoRow label="Pool Fee Tier" value={`${(launchInfo.poolFeeTier / 10000).toFixed(2)}%`} />
          <InfoRow label="Tick Spacing" value={launchInfo.tickSpacing.toString()} />
          <InfoRow label="Auction Duration" value={formatDuration(launchInfo.auctionDuration)} />
          <InfoRow label="Pricing Steps" value={launchInfo.pricingSteps.toString()} />
          <InfoRow label="Reserve Price" value={formatUnits(launchInfo.reservePrice, 18)} />
          <InfoRow label="Lockup Duration" value={formatDuration(launchInfo.lockupDuration)} />
          <InfoRow label="Platform Fee on LP" value={formatBps(launchInfo.platformFeeOnLPFees)} />
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
                <p className="text-2xl font-bold font-mono">{formatCountdown(timeRemaining)}</p>
              </div>
            )}
            <InfoRow label="CCA Contract" value={auctionInfo.cca} isAddress explorerUrl={explorerUrl} />
            <InfoRow label="Start Time" value={Number(auctionInfo.startTime) > 0 ? new Date(Number(auctionInfo.startTime) * 1000).toLocaleString() : "Not started"} />
            <InfoRow label="End Time" value={Number(auctionInfo.endTime) > 0 ? new Date(Number(auctionInfo.endTime) * 1000).toLocaleString() : "N/A"} />
            <InfoRow label="Current Price" value={formatUnits(auctionInfo.currentPrice, 18)} />
            <InfoRow label="Reserve Price" value={formatUnits(auctionInfo.reservePrice, 18)} />
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
            <InfoRow label="Liquidity Created" value={formatUnits(distInfo.liquidityCreated, 18)} />
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
              <InfoRow label="Lockup Contract" value={distInfo.lockupContract} isAddress explorerUrl={explorerUrl} />
            )}
            {distInfo.positionTokenId > BigInt(0) && (
              <InfoRow label="Position Token ID" value={distInfo.positionTokenId.toString()} />
            )}
            {unlockTime > 0 && currentState === LaunchState.LOCKED && (
              <div className="sm:col-span-2 rounded-lg bg-orange-50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Unlock In</p>
                <p className="text-xl font-bold font-mono">
                  {unlockRemaining > 0 ? formatCountdown(unlockRemaining) : "Unlockable now"}
                </p>
              </div>
            )}
            {isPermissionless !== undefined && (
              <InfoRow label="Permissionless Distribution" value={isPermissionless ? "Yes" : "No"} />
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
    const actions: React.ReactElement[] = [];

    // FINALIZED → Start Auction
    if ( connectedAddress) {
      actions.push(
        <ActionButton
        disabled={!isOperator || currentState !== LaunchState.FINALIZED}
          key="start-auction"
          label="Start Auction"
          functionName="startAuction"
          contractAddress={address}
          onSuccess={handleRefetch}
        />
      );
    }

    // SETUP → Finalize Setup
    if ( connectedAddress) {
      actions.push(
        <ActionButton
        disabled={!isOperator || currentState !== LaunchState.SETUP}
          key="finalize-setup"
          label="Finalize Setup"
          functionName="finalizeSetup"
          contractAddress={address}
          onSuccess={handleRefetch}
        />
      );
    }


    // AUCTION_ENDED → distribution actions
    if (currentState === LaunchState.AUCTION_ENDED) {
      const canAct = isOperator || isPermissionless;
      if (canAct) {
        actions.push(
          <ActionButton
            key="distribute-all"
            label="Distribute All"
            functionName="distributeAll"
            contractAddress={address}
            onSuccess={handleRefetch}
          />,
          <ActionButton
            key="distribute-liquidity"
            label="Distribute Liquidity"
            functionName="distributeLiquidity"
            contractAddress={address}
            variant="outline"
            onSuccess={handleRefetch}
          />,
          <ActionButton
            key="distribute-treasury"
            label="Distribute Treasury"
            functionName="distributeTreasury"
            contractAddress={address}
            variant="outline"
            onSuccess={handleRefetch}
          />
        );
      }
      // Finalize failed auction (anyone can call)
      actions.push(
        <ActionButton
          key="finalize-failed"
          label="Finalize Failed Auction"
          functionName="finalizeFailedAuction"
          contractAddress={address}
          variant="destructive"
          onSuccess={handleRefetch}
        />
      );
    }

    // DISTRIBUTED / LOCKED / UNLOCKED → sweep + withdraw
    if (
      currentState === LaunchState.DISTRIBUTED ||
      currentState === LaunchState.LOCKED ||
      currentState === LaunchState.UNLOCKED
    ) {
      if (isOperator) {
        actions.push(
          <ActionButton
            key="sweep-token"
            label="Sweep Token"
            functionName="sweepToken"
            contractAddress={address}
            variant="outline"
            onSuccess={handleRefetch}
          />,
          <ActionButton
            key="sweep-payment"
            label="Sweep Payment Token"
            functionName="sweepPaymentToken"
            contractAddress={address}
            variant="outline"
            onSuccess={handleRefetch}
          />
        );
      }
      if (currentState === LaunchState.LOCKED && isOperator && unlocked) {
        actions.push(
          <ActionButton
            key="withdraw-position"
            label="Withdraw Position"
            functionName="withdrawPosition"
            contractAddress={address}
            onSuccess={handleRefetch}
          />
        );
      }
    }

    if (actions.length === 0) {
      if (currentState === LaunchState.AUCTION_ACTIVE) {
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
                <appkit-button />
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
          <div className="grid gap-3 sm:grid-cols-2">{actions}</div>
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
          {/* Transfer operator (only current operator) */}
          {isOperator && (
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
          )}

          {/* Pending operator display */}
          {pendingOp && pendingOp !== ZERO_ADDRESS && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800 mb-1">Pending Operator Transfer</p>
              <p className="text-xs font-mono text-amber-700">{pendingOp}</p>
            </div>
          )}

          {/* Accept operator (only pending operator) */}
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
