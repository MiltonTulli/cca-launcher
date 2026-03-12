"use client";

import { AlertTriangle, Coins, FileText, Lock, Scale, ScrollText, Workflow } from "lucide-react";
import { useState } from "react";
import { formatUnits } from "viem";
import { InfoRow } from "@/components/InfoRow";
import type { UseCCADataReturn } from "@/hooks/useCCAData";
import { blocksToTimeEstimate, q96PriceToDisplay } from "@/lib/q96";
import { formatCompactNumber, ZERO_ADDRESS } from "@/lib/utils";

type TabId = "auction-details" | "how-it-works" | "token-overview";

interface AuctionInfoTabsProps {
  data: UseCCADataReturn;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      {children}
    </h4>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 border border-border">
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h5>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export function AuctionInfoTabs({ data }: AuctionInfoTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("auction-details");

  const {
    tokenAddress,
    currencyAddress,
    totalSupply,
    floorPrice,
    maxBidPrice,
    tickSpacing,
    startBlock,
    endBlock,
    claimBlock,
    fundsRecipient,
    tokensRecipient,
    validationHook,
    tokenDecimals,
    currencyDecimals,
    tokenSymbol,
    currencySymbol,
    explorerUrl,
    chainId,
  } = data;

  const tDec = tokenDecimals ?? 18;
  const cDec = currencyDecimals ?? 18;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Tabs header */}
      <div className="px-6 py-4 overflow-x-auto">
        <div className="bg-muted p-1 rounded-lg inline-flex min-w-max">
          <TabButton
            active={activeTab === "auction-details"}
            onClick={() => setActiveTab("auction-details")}
          >
            Auction Details
          </TabButton>
          <TabButton
            active={activeTab === "how-it-works"}
            onClick={() => setActiveTab("how-it-works")}
          >
            How the Auction Works
          </TabButton>
          <TabButton
            active={activeTab === "token-overview"}
            onClick={() => setActiveTab("token-overview")}
          >
            Token Overview
          </TabButton>
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6 md:p-8">
        {/* Auction Details */}
        {activeTab === "auction-details" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <SectionTitle>
                <Coins className="w-4 h-4" /> Auction Parameters
              </SectionTitle>
              <div className="space-y-1">
                <InfoRow
                  label="Token"
                  value={tokenAddress ?? ""}
                  isAddress
                  explorerUrl={explorerUrl}
                  prefix={tokenSymbol}
                />
                <InfoRow
                  label="Currency"
                  value={currencyAddress ?? ""}
                  isAddress
                  explorerUrl={explorerUrl}
                  prefix={currencySymbol}
                />
                <InfoRow
                  label="Tokens for Auction"
                  value={
                    totalSupply !== undefined
                      ? `${formatCompactNumber(formatUnits(totalSupply, tDec))} ${tokenSymbol ?? ""}`
                      : "..."
                  }
                />
                <InfoRow
                  label="Floor Price"
                  value={
                    floorPrice !== undefined
                      ? `${q96PriceToDisplay(floorPrice, tDec, cDec)} ${currencySymbol ?? (currencyAddress === ZERO_ADDRESS ? "ETH" : "")}`
                      : "..."
                  }
                />
                <InfoRow label="Tick Spacing" value={tickSpacing?.toString() ?? "..."} />
              </div>
            </div>

            <div>
              <SectionTitle>
                <Lock className="w-4 h-4" /> Timing (Blocks)
              </SectionTitle>
              <div className="space-y-1">
                <InfoRow
                  label="Start Block"
                  value={startBlock !== undefined ? startBlock.toString() : "..."}
                  isBlock={startBlock !== undefined}
                  explorerUrl={explorerUrl}
                />
                <InfoRow
                  label="End Block"
                  value={endBlock !== undefined ? endBlock.toString() : "..."}
                  isBlock={endBlock !== undefined}
                  explorerUrl={explorerUrl}
                />
                <InfoRow
                  label="Claim Block"
                  value={claimBlock !== undefined ? claimBlock.toString() : "..."}
                  isBlock={claimBlock !== undefined}
                  explorerUrl={explorerUrl}
                />
                {startBlock !== undefined && endBlock !== undefined && (
                  <InfoRow
                    label="Auction Duration"
                    value={`${(Number(endBlock) - Number(startBlock)).toLocaleString()} blocks (~${blocksToTimeEstimate(Number(endBlock) - Number(startBlock), chainId)})`}
                  />
                )}
              </div>
            </div>

            <div>
              <SectionTitle>
                <Workflow className="w-4 h-4" /> Flow of Funds
              </SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2 p-4 bg-muted rounded-xl border border-border">
                  <div className="h-8 px-2 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-sm text-muted-foreground font-mono text-xs font-bold w-min">
                    Treasury
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm">Funds Recipient</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Raised currency is sent to the configured funds recipient after the auction
                      concludes successfully.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-4 bg-muted rounded-xl border border-border">
                  <div className="h-8 px-2 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-sm text-muted-foreground font-mono text-xs font-bold w-min">
                    Tokens
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm">Unsold Tokens</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Any unsold tokens are swept to the tokens recipient address after the auction
                      ends.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-4 bg-muted rounded-xl border border-border">
                  <div className="h-8 px-2 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-sm text-muted-foreground font-mono text-xs font-bold w-min">
                    Escrow
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm">Smart Contract</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All funds are held in a non-custodial smart contract escrow during the
                      auction.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionTitle>
                <FileText className="w-4 h-4" /> Recipients
              </SectionTitle>
              <div className="space-y-1">
                <InfoRow
                  label="Funds Recipient"
                  value={fundsRecipient ?? ""}
                  isAddress
                  explorerUrl={explorerUrl}
                />
                <InfoRow
                  label="Tokens Recipient"
                  value={tokensRecipient ?? ""}
                  isAddress
                  explorerUrl={explorerUrl}
                />
                <InfoRow
                  label="Validation Hook"
                  value={
                    validationHook && validationHook !== ZERO_ADDRESS ? validationHook : "None"
                  }
                  isAddress={!!validationHook && validationHook !== ZERO_ADDRESS}
                  explorerUrl={explorerUrl}
                />
              </div>
            </div>
          </div>
        )}

        {/* How the Auction Works */}
        {activeTab === "how-it-works" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 p-4 bg-muted rounded-xl border border-border">
                <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-sm text-muted-foreground font-mono text-xs font-bold">
                  01
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-sm">Place Order</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set your budget and optionally a maximum token price. Market orders accept any
                    clearing price.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-muted rounded-xl border border-border">
                <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-sm text-muted-foreground font-mono text-xs font-bold">
                  02
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-sm">Automatic Pricing</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Each period the auction sets a clearing price based on total demand. All
                    participants pay the same fair price.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-muted rounded-xl border border-border">
                <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-sm text-muted-foreground font-mono text-xs font-bold">
                  03
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-sm">Claim Allocation</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    After the auction ends, exit your bid then claim your {tokenSymbol ?? "tokens"}{" "}
                    and any unspent funds.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoBlock title="Auction Mechanism">
                This auction uses the Continuous Clearing Auction (CCA). It is a streaming auction
                where capital commits are split over time. This discovery mechanism prevents
                front-running and ensures a fair clearing price for all participants.
              </InfoBlock>
              <InfoBlock title="Escrow & Settlement">
                Funds are held in a non-custodial smart contract escrow. The issuer cannot access
                funds until the auction concludes successfully. If the auction fails, funds are
                returned to participants.
              </InfoBlock>
            </div>

            <div className="space-y-4">
              <SectionTitle>
                <Scale className="w-4 h-4" /> Terms & Risks
              </SectionTitle>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 text-amber-900 dark:text-amber-600">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="block font-semibold mb-1">Risk Disclosure</strong>
                    Tokens are high-risk assets. You should only commit capital you are prepared to
                    lose. The clearing price is market-driven and may differ from the listing price
                    on secondary markets.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted border border-border text-muted-foreground">
                  <ScrollText className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="block font-semibold text-foreground mb-1">
                      Terms of Service
                    </strong>
                    By participating in this auction, you acknowledge and accept the risks
                    associated with token auctions and smart contract interactions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Overview */}
        {activeTab === "token-overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <SectionTitle>
                  <FileText className="w-4 h-4" /> Token Details
                </SectionTitle>
                <div className="space-y-1">
                  <InfoRow label="Token Standard" value="ERC-20" />
                  <InfoRow
                    label="Contract Address"
                    value={tokenAddress ?? ""}
                    isAddress
                    explorerUrl={explorerUrl}
                    prefix={tokenSymbol}
                  />
                  <InfoRow label="Symbol" value={tokenSymbol ?? "..."} />
                  <InfoRow label="Decimals" value={tokenDecimals?.toString() ?? "..."} />
                  <InfoRow
                    label="Total Supply"
                    value={
                      totalSupply !== undefined
                        ? `${formatCompactNumber(formatUnits(totalSupply, tDec))} ${tokenSymbol ?? ""}`
                        : "..."
                    }
                  />
                </div>
              </div>

              <div>
                <SectionTitle>
                  <Coins className="w-4 h-4" /> Currency Details
                </SectionTitle>
                <div className="space-y-1">
                  <InfoRow
                    label="Contract Address"
                    value={currencyAddress ?? ""}
                    isAddress
                    explorerUrl={explorerUrl}
                    prefix={currencySymbol}
                  />
                  <InfoRow label="Symbol" value={currencySymbol ?? "..."} />
                  <InfoRow label="Decimals" value={currencyDecimals?.toString() ?? "..."} />
                </div>
              </div>
            </div>

            <div>
              <SectionTitle>
                <Lock className="w-4 h-4" /> Auction Price Bounds
              </SectionTitle>
              <div className="space-y-1">
                <InfoRow
                  label="Floor Price"
                  value={
                    floorPrice !== undefined
                      ? `${q96PriceToDisplay(floorPrice, tDec, cDec)} ${currencySymbol ?? ""}`
                      : "..."
                  }
                />
                <InfoRow
                  label="Max Bid Price"
                  value={
                    maxBidPrice !== undefined
                      ? `${q96PriceToDisplay(maxBidPrice, tDec, cDec)} ${currencySymbol ?? ""}`
                      : "..."
                  }
                />
                <InfoRow label="Tick Spacing" value={tickSpacing?.toString() ?? "..."} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
