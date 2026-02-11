"use client";

import { Address } from "viem";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { XCircle, RefreshCw } from "lucide-react";
import { useCCAData } from "@/hooks/useCCAData";

import { AuctionHeader } from "./AuctionHeader";
import { KeyMetrics } from "./KeyMetrics";
import { AllBidsTable } from "./AllBidsTable";
import { ControlPanel } from "./ControlPanel";
import { AuctionInfoTabs } from "./AuctionInfoTabs";
import { AuctionActionsPanel } from "./AuctionActionsPanel";

interface AuctionDetailProps {
  address: Address;
}

export function AuctionDetail({ address }: AuctionDetailProps) {
  const data = useCCAData(address);

  if (data.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading auction data...</p>
      </div>
    );
  }

  if (data.isError || !data.tokenAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load auction</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm text-center">
          Could not read data from the CCA contract at this address. It may not be a valid
          CCA auction contract.
        </p>
        <Button variant="outline" onClick={data.refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: token logo + name + phase */}
      <AuctionHeader
        ccaAddress={address}
        phase={data.phase}
        tokenSymbol={data.tokenSymbol}
        chainId={data.chainId}
        onRefresh={data.refetch}
      />

      {/* Key metrics: progress bar + 4 stat cards */}
      <KeyMetrics data={data} />

      {/* Main grid: bids table (8 cols) + control panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Control panel + admin actions — order-first on mobile */}
        <div className="lg:col-span-4 lg:order-last order-first space-y-4">
          <div className="lg:sticky lg:top-6 space-y-4">
            <ControlPanel data={data} ccaAddress={address} />
            <AuctionActionsPanel
              ccaAddress={address}
              phase={data.phase}
              onRefresh={data.refetch}
            />
          </div>
        </div>

        {/* Bids table + auction info tabs */}
        <div className="lg:col-span-8 space-y-6">
          <AllBidsTable data={data} />
          <AuctionInfoTabs data={data} />
        </div>
      </div>
    </div>
  );
}
