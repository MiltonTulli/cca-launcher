"use client";

import { Address } from "viem";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { XCircle, RefreshCw } from "lucide-react";
import { useCCAData } from "@/hooks/useCCAData";

import { SaleHeader } from "./SaleHeader";
import { KeyMetrics } from "./KeyMetrics";
import { AllBidsTable } from "./AllBidsTable";
import { ControlPanel } from "./ControlPanel";
import { SaleInfoCard } from "./SaleInfoCard";
import { SaleActionsPanel } from "./SaleActionsPanel";

interface SaleDetailProps {
  address: Address;
}

export function SaleDetail({ address }: SaleDetailProps) {
  const data = useCCAData(address);

  if (data.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading sale data...</p>
      </div>
    );
  }

  if (data.isError || !data.tokenAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load sale</h2>
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
      <SaleHeader
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
        {/* Control panel — order-first on mobile so it appears above bids */}
        <div className="lg:col-span-4 lg:order-last order-first">
          <div className="lg:sticky lg:top-6">
            <ControlPanel data={data} ccaAddress={address} />
          </div>
        </div>

        {/* Bids table */}
        <div className="lg:col-span-8">
          <AllBidsTable data={data} />
        </div>
      </div>

      {/* Auction parameters */}
      <SaleInfoCard data={data} />

      {/* Admin actions (sweep) */}
      <SaleActionsPanel
        ccaAddress={address}
        phase={data.phase}
        onRefresh={data.refetch}
      />
    </div>
  );
}
