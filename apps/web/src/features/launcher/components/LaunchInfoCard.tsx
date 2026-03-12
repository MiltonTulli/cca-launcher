"use client";

import { formatUnits } from "viem";
import { TokenSource } from "@launcher/sdk";
import type { LaunchData } from "../utils/fromLaunchData";
import { AddressLink } from "@/components/AddressLink";
import { InfoRow } from "@/components/InfoRow";
import { TOKEN_SOURCE_OPTIONS } from "../utils/displayState";
import { POOL_FEE_TIERS } from "@launcher/sdk";
import { shortenAddress } from "@/lib/utils";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface LaunchInfoCardProps {
  launchData: LaunchData;
  chainId?: number;
  tokenSymbol?: string;
  tokenDecimals?: number;
  paymentTokenSymbol?: string;
}

/** Format a token label as "SYMBOL (0xAbC…dEf)" or just shortened address */
function tokenLabel(symbol: string | undefined, address: string) {
  if (!symbol) return shortenAddress(address);
  return `${symbol} (${shortenAddress(address)})`;
}

/** Format a bigint token amount with decimals, e.g. "10,000 CULO" */
function formatTokenAmount(
  amount: bigint,
  decimals: number | undefined,
  symbol: string | undefined,
  isTokenSet: boolean,
): string {
  if (!isTokenSet) return "Not set yet";
  const dec = decimals ?? 18;
  const formatted = Number(formatUnits(amount, dec)).toLocaleString("en-US", {
    maximumFractionDigits: 4,
  });
  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function LaunchInfoCard({ launchData, chainId, tokenSymbol, tokenDecimals, paymentTokenSymbol }: LaunchInfoCardProps) {
  const tokenSourceLabel = TOKEN_SOURCE_OPTIONS.find((o) => o.value === launchData.tokenSource)?.label ?? "Unknown";
  const poolFeeLabel = POOL_FEE_TIERS.find((t) => t.value === launchData.poolFee)?.label ?? `${launchData.poolFee}`;

  const isTokenSet = launchData.token !== ZERO_ADDRESS;
  const isPaymentTokenNative = launchData.paymentToken === ZERO_ADDRESS;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold">Launch Info</h3>
      <div className="space-y-2">
        <InfoRow label="Launch ID" value={launchData.launchId.toString()} />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Operator</span>
          <AddressLink address={launchData.operator} chainId={chainId} />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Token</span>
          {isTokenSet ? (
            <AddressLink
              address={launchData.token}
              chainId={chainId}
              label={tokenLabel(tokenSymbol, launchData.token)}
            />
          ) : (
            <span className="text-xs text-muted-foreground italic">Not set yet (Create New Token)</span>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payment Token</span>
          {isPaymentTokenNative ? (
            <span className="text-xs font-medium">Native ETH</span>
          ) : (
            <AddressLink
              address={launchData.paymentToken}
              chainId={chainId}
              label={tokenLabel(paymentTokenSymbol, launchData.paymentToken)}
            />
          )}
        </div>
        <InfoRow label="Token Source" value={tokenSourceLabel} />
        <InfoRow
          label="Auction Tokens"
          value={formatTokenAmount(launchData.auctionTokenAmount, tokenDecimals, tokenSymbol, isTokenSet)}
        />
        <InfoRow
          label="Liquidity Tokens"
          value={formatTokenAmount(launchData.liquidityTokenAmount, tokenDecimals, tokenSymbol, isTokenSet)}
        />

        <div className="border-t pt-2 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Settlement</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Treasury</span>
            <AddressLink address={launchData.treasuryAddress} chainId={chainId} />
          </div>
          <InfoRow label="Distribution Delay" value={`${launchData.permissionlessDistributionDelay.toString()} blocks`} />
        </div>

        {launchData.liquidityEnabled && (
          <div className="border-t pt-2 mt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Liquidity Config</p>
            <InfoRow label="Proceeds to LP" value={`${(launchData.proceedsToLiquidityBps / 100).toFixed(1)}%`} />
            <InfoRow label="Pool Fee" value={poolFeeLabel} />
            <InfoRow label="Tick Range" value={`[${launchData.tickLower}, ${launchData.tickUpper}]`} />
            <InfoRow label="Lockup" value={launchData.lockupEnabled ? `${Number(launchData.lockupDuration) / 86400} days` : "None"} />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Beneficiary</span>
              <AddressLink address={launchData.positionBeneficiary} chainId={chainId} />
            </div>
          </div>
        )}

        <div className="border-t pt-2 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Platform Fees (snapshotted)</p>
          <InfoRow label="Sale Fee" value={`${(launchData.saleFeeBpsSnapshot / 100).toFixed(1)}%`} />
          {launchData.liquidityEnabled && (
            <InfoRow label="LP Fee Share" value={`${(launchData.lpFeeShareBps / 100).toFixed(1)}%`} />
          )}
        </div>
      </div>
    </div>
  );
}
