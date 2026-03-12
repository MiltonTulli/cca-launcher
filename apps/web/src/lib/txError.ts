/**
 * Parse blockchain/wallet errors into user-friendly messages.
 */
export function parseTxError(err: unknown): { title: string; description?: string } {
  const raw = err instanceof Error ? err.message : String(err);

  // User rejected in wallet
  if (
    raw.includes("User rejected") ||
    raw.includes("User denied") ||
    raw.includes("ACTION_REJECTED")
  ) {
    return { title: "Transaction rejected", description: "You rejected the transaction in your wallet." };
  }

  // Insufficient funds
  if (raw.includes("insufficient funds") || raw.includes("InsufficientFunds")) {
    return { title: "Insufficient funds", description: "Your wallet doesn't have enough funds for this transaction." };
  }

  // Contract revert
  if (raw.includes("reverted") || raw.includes("execution reverted")) {
    const match = raw.match(/reason:\s*(.+?)(?:\n|$)/);
    return {
      title: "Transaction failed",
      description: match?.[1] || "The contract reverted the transaction.",
    };
  }

  // Chain mismatch
  if (raw.includes("chain") && raw.includes("mismatch")) {
    return { title: "Wrong network", description: "Please switch to the correct network in your wallet." };
  }

  // Network / RPC errors
  if (raw.includes("network") || raw.includes("timeout") || raw.includes("ETIMEDOUT")) {
    return { title: "Network error", description: "Could not reach the network. Please try again." };
  }

  // Fallback — use shortMessage if available
  const shortMessage = (err as any)?.shortMessage;
  if (shortMessage && shortMessage.length < 200) {
    return { title: "Transaction failed", description: shortMessage };
  }

  return { title: "Something went wrong", description: "An unexpected error occurred. Please try again." };
}
