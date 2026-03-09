"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CHAIN_METADATA } from "@/config/chains";

const CHAIN_OPTIONS = Object.entries(CHAIN_METADATA).map(([id, meta]) => ({
  value: id,
  label: meta.name,
}));

interface SubmitAuctionFormProps {
  onSuccess: () => void;
}

export function SubmitAuctionForm({ onSuccess }: SubmitAuctionFormProps) {
  const { address: account } = useAccount();
  const [open, setOpen] = useState(false);
  const [ccaAddress, setCcaAddress] = useState("");
  const [chainId, setChainId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!account) {
      setError("Connect your wallet to submit an auction.");
      return;
    }

    if (!ccaAddress || !isAddress(ccaAddress)) {
      setError("Enter a valid contract address.");
      return;
    }

    if (!chainId) {
      setError("Select a network.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/community-ccas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ccaAddress,
          chainId: Number(chainId),
          submittedBy: account,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit auction.");
        return;
      }

      setSuccess(true);
      setCcaAddress("");
      setChainId("");
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          List Your Auction
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="CCA contract address (0x...)"
              value={ccaAddress}
              onChange={(e) => {
                setCcaAddress(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              className="flex-1 font-mono text-sm"
            />
            <Select
              value={chainId}
              onValueChange={(v) => {
                setChainId(v);
                setError(null);
                setSuccess(false);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Network" />
              </SelectTrigger>
              <SelectContent>
                {CHAIN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !account}
              className="sm:w-[120px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Validating
                </span>
              ) : (
                "Submit"
              )}
            </Button>
          </div>

          {!account && (
            <p className="text-xs text-muted-foreground">
              Connect your wallet to submit an auction.
            </p>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Auction submitted successfully!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
