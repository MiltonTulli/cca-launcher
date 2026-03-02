"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { CCAPhase, BidStatus } from "@/config/contracts";
import { q96PriceToDisplay, q96Decode } from "@/lib/q96";
import { shortenAddress, ZERO_ADDRESS } from "@/lib/utils";
import { useBidActions } from "@/hooks/useBidActions";
import { BidStatusBadge } from "./BidStatusBadge";
import type { UseCCADataReturn } from "@/hooks/useCCAData";
import { WalletButton } from "@/components/WalletButton";

interface ControlPanelProps {
  data: UseCCADataReturn;
  ccaAddress: `0x${string}`;
}

export function ControlPanel({ data, ccaAddress }: ControlPanelProps) {
  const {
    phase,
    connectedAddress,
    currencyAddress,
    currencyDecimals,
    tokenDecimals,
    maxBidPrice,
    tickSpacing,
    floorPrice,
    tokenSymbol,
    currencySymbol,
    userCurrencyBalance,
    userErc20AllowanceForPermit2,
    userPermit2AllowanceForCCA,
    allBids,
    validationHook,
    refetch,
  } = data;

  const hasValidationHook = !!validationHook && validationHook !== ZERO_ADDRESS;

  const isNativeCurrency = !currencyAddress || currencyAddress === ZERO_ADDRESS;
  const tDec = tokenDecimals ?? 18;
  const cDec = currencyDecimals ?? 18;
  const userBids = allBids.filter((b) => b.isUserBid);

  const actions = useBidActions({
    ccaAddress,
    currencyAddress,
    currencyDecimals,
    tokenDecimals,
    maxBidPrice,
    tickSpacing,
    permitterAddress: validationHook,
    onSuccess: refetch,
  });

  // Hotfix: always show bid form regardless of phase
  return (
    <PanelShell>
      {hasValidationHook && (
        <div className="p-4 border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                This auction has a validation hook
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                Bidding requires authorization from the hook contract. Bids without valid hook data will be rejected.
              </p>
              <p className="text-[10px] text-amber-500 dark:text-amber-500 mt-1 font-mono">
                {shortenAddress(validationHook)}
              </p>
            </div>
          </div>
        </div>
      )}
      <BidFormContent
        data={data}
        ccaAddress={ccaAddress}
        actions={actions}
        isNativeCurrency={isNativeCurrency}
        tDec={tDec}
        cDec={cDec}
      />
      <UserBidsSection
        userBids={userBids}
        phase={phase}
        tDec={tDec}
        cDec={cDec}
        tokenSymbol={tokenSymbol}
        currencySymbol={currencySymbol}
        maxBidPrice={maxBidPrice}
        actions={actions}
      />
    </PanelShell>
  );
}

// ─── Shell ───────────────────────────────────────────────

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {children}
    </div>
  );
}

// ─── Bid Form (LIVE phase) ──────────────────────────────

function BidFormContent({
  data,
  ccaAddress,
  actions,
  isNativeCurrency,
  tDec,
  cDec,
}: {
  data: UseCCADataReturn;
  ccaAddress: `0x${string}`;
  actions: ReturnType<typeof useBidActions>;
  isNativeCurrency: boolean;
  tDec: number;
  cDec: number;
}) {
  const {
    connectedAddress,
    currencySymbol,
    currencyDecimals,
    userCurrencyBalance,
    userErc20AllowanceForPermit2,
    userPermit2AllowanceForCCA,
    floorPrice,
  } = data;

  const [amount, setAmount] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bidMode, setBidMode] = useState<"simple" | "advanced">("simple");

  // Approval step detection for ERC20
  const approvalStep = (() => {
    if (isNativeCurrency || !amount || !currencyDecimals) return "ready";
    try {
      const amountUnits = parseUnits(amount, currencyDecimals);
      if (
        userErc20AllowanceForPermit2 === undefined ||
        amountUnits > userErc20AllowanceForPermit2
      ) {
        return "erc20" as const;
      }
      if (
        userPermit2AllowanceForCCA === undefined ||
        amountUnits > userPermit2AllowanceForCCA
      ) {
        return "permit2" as const;
      }
      return "ready" as const;
    } catch {
      return "ready" as const;
    }
  })();

  const isBusy = actions.isPending || actions.isConfirming;
  const isApprovingErc20 = isBusy && actions.pendingAction === "approveErc20";
  const isApprovingPermit2 = isBusy && actions.pendingAction === "approvePermit2";
  const isSubmitting = isBusy && actions.pendingAction === "submitBid";

  const handleApproveErc20 = () => {
    actions.reset();
    actions.approveErc20ForPermit2();
  };

  const handleApprovePermit2 = () => {
    actions.reset();
    actions.approvePermit2ForCCA();
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    actions.reset();
    actions.submitBid(amount, maxPrice, bidMode === "simple");
  };

  if (!connectedAddress) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Place a bid</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your wallet to participate in this auction.
        </p>
        <WalletButton />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitBid}>
      {/* Header with mode toggle */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-semibold text-lg">Place a bid</h2>
          <div className="bg-muted p-0.5 rounded-lg inline-flex">
            <button
              type="button"
              onClick={() => setBidMode("simple")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                bidMode === "simple"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => setBidMode("advanced")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                bidMode === "advanced"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Amount input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Total budget
          </label>
          <div className="relative">
            <input
              type="number"
              className="no-spinner w-full bg-muted border border-border rounded-xl px-4 py-4 pb-8 pr-[80px] text-foreground text-2xl font-bold placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="any"
              min="0"
            />
            <span className="absolute top-4 right-4 text-sm text-muted-foreground font-bold">
              {currencySymbol ?? "ETH"}
            </span>
            {userCurrencyBalance !== undefined && (
              <span className="absolute bottom-2 right-4 text-[10px] text-muted-foreground">
                Balance: {formatUnits(userCurrencyBalance, cDec)}
              </span>
            )}
          </div>
        </div>

        {/* Max price input (advanced) */}
        {bidMode === "advanced" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Max token price
            </label>
            <div className="relative">
              <input
                type="number"
                className="no-spinner w-full bg-muted border border-border rounded-xl px-4 py-4 pb-8 pr-[80px] text-foreground text-2xl font-bold placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                step="any"
                min="0"
              />
              <span className="absolute top-4 right-4 text-sm text-muted-foreground font-bold">
                {currencySymbol ?? "ETH"}
              </span>
              {floorPrice !== undefined && (
                <span className="absolute bottom-2 right-4 text-[10px] text-muted-foreground">
                  Floor: {q96PriceToDisplay(floorPrice, tDec, cDec)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Market order info card (simple mode) */}
        {bidMode === "simple" && amount && (
          <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Market Order
              </span>
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 leading-relaxed">
              Spend a max of {amount} {currencySymbol ?? "ETH"} to buy{" "}
              {data.tokenSymbol ?? "tokens"} throughout the auction. Your bid will
              fill at whatever the clearing price is.
            </p>
          </div>
        )}

        {/* 3-step approval flow for ERC20 */}
        {approvalStep === "erc20" ? (
          <div className="space-y-2">
            <ApprovalButton
              label={`Approve ${currencySymbol ?? "Token"} for Permit2`}
              step="1 of 3"
              isActive
              isBusy={isApprovingErc20}
              isPending={actions.isPending}
              isSuccess={actions.isSuccess && actions.pendingAction === "approveErc20"}
              onClick={handleApproveErc20}
              disabled={!amount || isBusy}
            />
            <ApprovalButton label="Approve Permit2 for CCA" step="2 of 3" disabled />
            <SubmitBidButton disabled />
          </div>
        ) : approvalStep === "permit2" ? (
          <div className="space-y-2">
            <ApprovalButton label="Token Approved" step="1 of 3" isComplete />
            <ApprovalButton
              label="Approve Permit2 for CCA"
              step="2 of 3"
              isActive
              isBusy={isApprovingPermit2}
              isPending={actions.isPending}
              isSuccess={actions.isSuccess && actions.pendingAction === "approvePermit2"}
              onClick={handleApprovePermit2}
              disabled={!amount || isBusy}
            />
            <SubmitBidButton disabled />
          </div>
        ) : (
          <SubmitBidButton
            disabled={!amount || isBusy || (bidMode === "advanced" && !maxPrice)}
            isSubmitting={isSubmitting}
            isPending={actions.isPending}
            isSuccess={actions.isSuccess && actions.pendingAction === "submitBid"}
          />
        )}

        {/* Error */}
        {actions.error && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {actions.error.message.includes("User rejected")
              ? "Transaction rejected"
              : actions.error.message.length > 120
                ? actions.error.message.slice(0, 120) + "..."
                : actions.error.message}
          </p>
        )}
      </div>
    </form>
  );
}

// ─── Approval / Submit buttons ──────────────────────────

function ApprovalButton({
  label,
  step,
  isActive,
  isBusy,
  isPending,
  isSuccess,
  isComplete,
  onClick,
  disabled,
}: {
  label: string;
  step: string;
  isActive?: boolean;
  isBusy?: boolean;
  isPending?: boolean;
  isSuccess?: boolean;
  isComplete?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
        isComplete
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          : isActive
            ? "bg-muted border-border text-foreground hover:border-primary/50"
            : "bg-muted/50 border-border/50 text-muted-foreground cursor-not-allowed"
      }`}
      onClick={onClick}
      disabled={disabled || isComplete || !isActive}
    >
      <span className="flex items-center gap-2">
        {isComplete || isSuccess ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : isBusy ? (
          <Spinner size="sm" />
        ) : null}
        {isBusy ? (isPending ? "Approve in wallet..." : "Approving...") : label}
      </span>
      <span className="text-[10px] text-muted-foreground">Step {step}</span>
    </button>
  );
}

function SubmitBidButton({
  disabled,
  isSubmitting,
  isPending,
  isSuccess,
}: {
  disabled?: boolean;
  isSubmitting?: boolean;
  isPending?: boolean;
  isSuccess?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-sm"
    >
      {isSubmitting ? (
        <>
          <Spinner size="sm" />
          {isPending ? "Confirm in wallet..." : "Confirming..."}
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Bid Submitted
        </>
      ) : (
        <>
          Place Order
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </>
      )}
    </button>
  );
}

// ─── User's Active Bids Section ─────────────────────────

function UserBidsSection({
  userBids,
  phase,
  tDec,
  cDec,
  tokenSymbol,
  currencySymbol,
  maxBidPrice,
  actions,
}: {
  userBids: import("@/config/types").CCABidEntry[];
  phase: CCAPhase;
  tDec: number;
  cDec: number;
  tokenSymbol: string | undefined;
  currencySymbol: string | undefined;
  maxBidPrice: bigint | undefined;
  actions: ReturnType<typeof useBidActions>;
}) {
  if (userBids.length === 0) return null;

  // Bids that need to be exited first (ACTIVE after auction ended)
  const exitableBids = userBids.filter(
    (b) => b.status === BidStatus.ACTIVE && phase >= CCAPhase.ENDED,
  );
  // Bids that have been exited and can now be claimed (EXITED + has tokens + claimable phase)
  const claimableBids = userBids.filter(
    (b) =>
      b.status === BidStatus.EXITED &&
      b.bid.tokensFilled > BigInt(0) &&
      phase === CCAPhase.CLAIMABLE,
  );

  return (
    <div className="border-t border-border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Your Active Bids
        </span>
        {exitableBids.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => actions.exitBid(exitableBids[0].bidId)}
            disabled={actions.isPending || actions.isConfirming}
          >
            {actions.isPending || actions.isConfirming ? (
              <Spinner size="sm" />
            ) : (
              `Exit ${exitableBids.length === 1 ? "Bid" : `Next Bid`}`
            )}
          </Button>
        )}
        {claimableBids.length > 0 && exitableBids.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() =>
              claimableBids.length === 1
                ? actions.claimTokens(claimableBids[0].bidId)
                : actions.claimTokensBatch(claimableBids.map((b) => b.bidId))
            }
            disabled={actions.isPending || actions.isConfirming}
          >
            {actions.isPending || actions.isConfirming ? (
              <Spinner size="sm" />
            ) : (
              `Claim ${claimableBids.length === 1 ? "Tokens" : `All (${claimableBids.length})`}`
            )}
          </Button>
        )}
      </div>

      {/* Bid rows */}
      <div className="flex flex-col gap-px rounded-xl overflow-hidden">
        {userBids.map((entry) => {
          const { bidId, bid, status } = entry;
          const isMarketOrder =
            maxBidPrice !== undefined &&
            bid.maxPrice >= (maxBidPrice * BigInt(9)) / BigInt(10);
          const isInactive = status !== BidStatus.ACTIVE;
          const bgColor =
            status === BidStatus.ACTIVE
              ? "bg-green-500/5 dark:bg-green-500/10"
              : status === BidStatus.CLAIMED
                ? "bg-blue-500/5 dark:bg-blue-500/10"
                : "bg-muted/50";

          return (
            <div
              key={bidId}
              className={`relative p-3 ${bgColor} ${isInactive ? "opacity-60" : ""}`}
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground">
                    {formatUnits(q96Decode(bid.amountQ96), cDec)} {currencySymbol ?? ""}{" "}
                    <span className="text-muted-foreground">
                      at{" "}
                      {isMarketOrder
                        ? "Market"
                        : `${q96PriceToDisplay(bid.maxPrice, tDec, cDec)} ${currencySymbol ?? ""}`}
                    </span>
                  </div>
                  {bid.tokensFilled > BigInt(0) && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Filled: {formatUnits(bid.tokensFilled, tDec)} {tokenSymbol ?? ""}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* ACTIVE bids: always allow exit */}
                  {status === BidStatus.ACTIVE && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => actions.exitBid(bidId)}
                      disabled={actions.isPending || actions.isConfirming}
                    >
                      Exit
                    </Button>
                  )}
                  {/* EXITED bids with tokens: Claim in CLAIMABLE phase */}
                  {status === BidStatus.EXITED && bid.tokensFilled > BigInt(0) && phase === CCAPhase.CLAIMABLE && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => actions.claimTokens(bidId)}
                      disabled={actions.isPending || actions.isConfirming}
                    >
                      Claim
                    </Button>
                  )}
                  <BidStatusBadge status={status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {actions.error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {actions.error.message.includes("User rejected")
            ? "Transaction rejected"
            : actions.error.message.length > 80
              ? actions.error.message.slice(0, 80) + "..."
              : actions.error.message}
        </p>
      )}
    </div>
  );
}
