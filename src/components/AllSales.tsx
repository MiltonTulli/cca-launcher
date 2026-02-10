"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ShoppingCart, RefreshCw } from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { SaleCard } from "@/components/SaleCard";

export function AllSales() {
  const { sales, isLoading, refetch } = useSales();
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading sales...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">No active sales</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center">
          No CCA token sales have been started on this network yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sales.length} sale{sales.length !== 1 ? "s" : ""} on this network
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {[...sales].reverse().map((sale) => (
          <SaleCard key={sale.ccaAddress} sale={sale} now={now} />
        ))}
      </div>
    </div>
  );
}
