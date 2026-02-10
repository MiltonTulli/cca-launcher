import { formatUnits } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import type { SaleEntry } from "@/config/types";
import { shortenAddress, formatCountdown } from "@/lib/utils";

interface SaleCardProps {
  sale: SaleEntry;
  now: number;
}

export function SaleCard({ sale, now }: SaleCardProps) {
  const endTime = Number(sale.endTime);
  const timeRemaining = endTime > now ? endTime - now : 0;

  const statusLabel = sale.isActive
    ? "Live"
    : sale.hasEnded
      ? "Ended"
      : "Coming Soon";

  const statusColor = sale.isActive
    ? "bg-green-100 text-green-700"
    : sale.hasEnded
      ? "bg-yellow-100 text-yellow-700"
      : "bg-blue-100 text-blue-700";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Sale (Launch #{sale.launchId.toString()})
          </CardTitle>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
        <CardDescription className="font-mono text-xs">
          CCA: {shortenAddress(sale.ccaAddress)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm">
          {sale.isActive && timeRemaining > 0 && (
            <div className="rounded-lg bg-primary/5 p-2 text-center">
              <p className="text-xs text-muted-foreground">Time Remaining</p>
              <p className="text-lg font-bold font-mono">
                {formatCountdown(timeRemaining)}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Price</span>
            <span className="font-mono text-xs">
              {formatUnits(sale.currentPrice, 18)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Raised</span>
            <span className="font-mono text-xs">
              {formatUnits(sale.totalRaised, 18)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tokens Sold</span>
            <span className="font-mono text-xs">
              {formatUnits(sale.tokensSold, 18)}
            </span>
          </div>
          <div className="pt-3">
            <Link href={`/sales/${sale.ccaAddress}`}>
              <Button variant="outline" size="sm" className="w-full">
                <ShoppingCart className="h-4 w-4" />
                View Sale
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
