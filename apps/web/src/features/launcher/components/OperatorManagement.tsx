"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { launchOrchestratorAbi } from "@launcher/sdk";
import type { Address } from "viem";
import { isAddress } from "viem";
import type { LaunchData } from "../utils/fromLaunchData";
import { Button } from "@/components/ui/button";
import { AddressLink } from "@/components/AddressLink";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface OperatorManagementProps {
  launchData: LaunchData;
  launchAddress: Address;
  chainId?: number;
}

export function OperatorManagement({ launchData, launchAddress, chainId }: OperatorManagementProps) {
  const { address: userAddress } = useAccount();
  const [newOperator, setNewOperator] = useState("");

  const isOperator = userAddress?.toLowerCase() === launchData.operator.toLowerCase();
  const isPendingOperator = userAddress?.toLowerCase() === launchData.pendingOperator?.toLowerCase();
  const hasPendingTransfer = launchData.pendingOperator !== ZERO_ADDRESS;

  const { writeContractAsync: transfer, data: transferHash, isPending: isTransferring } = useWriteContract();
  const { writeContractAsync: accept, data: acceptHash, isPending: isAccepting } = useWriteContract();

  const { isLoading: isTransferConfirming } = useWaitForTransactionReceipt({ hash: transferHash });
  const { isLoading: isAcceptConfirming } = useWaitForTransactionReceipt({ hash: acceptHash });

  const handleTransfer = async () => {
    if (!isAddress(newOperator)) return;
    await transfer({
      address: launchAddress,
      abi: launchOrchestratorAbi,
      functionName: "transferOperator",
      args: [newOperator as Address],
      chainId,
    });
    setNewOperator("");
  };

  const handleAccept = async () => {
    await accept({
      address: launchAddress,
      abi: launchOrchestratorAbi,
      functionName: "acceptOperator",
      chainId,
    });
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold">Operator Management</h3>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Current Operator</span>
        <AddressLink address={launchData.operator} chainId={chainId} />
      </div>

      {hasPendingTransfer && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pending Operator</span>
          <AddressLink address={launchData.pendingOperator} chainId={chainId} />
        </div>
      )}

      {/* Transfer UI for current operator */}
      {isOperator && (
        <div className="space-y-2 border-t pt-2">
          <input
            type="text"
            placeholder="New operator address (0x...)"
            value={newOperator}
            onChange={(e) => setNewOperator(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <Button
            onClick={handleTransfer}
            disabled={!isAddress(newOperator) || isTransferring || isTransferConfirming}
            variant="outline"
            size="sm"
          >
            {isTransferring || isTransferConfirming ? "Transferring..." : "Transfer Operator"}
          </Button>
        </div>
      )}

      {/* Accept UI for pending operator */}
      {isPendingOperator && (
        <div className="border-t pt-2">
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isAcceptConfirming}
            size="sm"
          >
            {isAccepting || isAcceptConfirming ? "Accepting..." : "Accept Operator Role"}
          </Button>
        </div>
      )}
    </div>
  );
}
