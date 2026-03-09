import { shortenAddress } from "@/lib/utils";

interface SummaryRowProps {
  label: string;
  value?: string;
  mono?: boolean;
}

export function SummaryRow({ label, value, mono = false }: SummaryRowProps) {
  if (!value) return null;

  const displayValue = mono && value.length > 20 ? shortenAddress(value, 4) : value;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{displayValue}</span>
    </div>
  );
}
