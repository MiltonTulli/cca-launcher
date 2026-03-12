import { ExternalLink } from "lucide-react";
import { getExplorerUrl, shortenAddress } from "@/lib/utils";

interface AddressLinkProps {
  address: string;
  chainId?: number;
  type?: "address" | "tx";
  label?: string;
  className?: string;
}

export function AddressLink({ address, chainId = 1, type = "address", label, className }: AddressLinkProps) {
  return (
    <a
      href={getExplorerUrl(chainId, type, address)}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ||
        "flex items-center gap-1 font-mono text-xs text-primary hover:underline truncate"
      }
    >
      {label ?? shortenAddress(address)}
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}
