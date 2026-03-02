import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Constants
// ============================================

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  42161: "https://arbiscan.io",
  421614: "https://sepolia.arbiscan.io",
};

export const BASIS_POINTS = BigInt(10_000);

// ============================================
// Formatting
// ============================================

export function shortenAddress(address: string | undefined | null, chars = 4): string {
  if (!address || address.length < 10) return address || "\u2014";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function shortenTxHash(hash: string, chars = 6): string {
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function formatDuration(seconds: number | bigint): string {
  const s = Number(seconds);
  if (s === 0) return "None";
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.length > 0 ? parts.join(" ") : "0m";
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Ended";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export function formatBps(bps: bigint | number): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

export function getExplorerUrl(chainId: number, type: "address" | "tx", hash: string): string {
  const base = EXPLORER_URLS[chainId] || "https://etherscan.io";
  return `${base}/${type}/${hash}`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
