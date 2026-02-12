"use client";

import { useState } from "react";
import { Address, isAddress } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft } from "lucide-react";
import { ZERO_ADDRESS } from "@/lib/utils";
import { ActionButton } from "./ActionButton";

interface OperatorManagementProps {
  address: Address;
  isOperator: boolean;
  isPendingOperator: boolean;
  pendingOp: Address | undefined;
  onRefresh: () => void;
}

export function OperatorManagement({
  address,
  isOperator,
  isPendingOperator,
  pendingOp,
  onRefresh,
}: OperatorManagementProps) {
  const [transferTo, setTransferTo] = useState("");

  if (!isOperator && !isPendingOperator) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Operator Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOperator && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Transfer Operator Role</label>
              <div className="flex gap-2">
                <Input
                  placeholder="New operator address (0x...)"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="font-mono text-xs"
                />
                <ActionButton
                  label="Transfer"
                  functionName="transferOperator"
                  contractAddress={address}
                  args={[transferTo as Address]}
                  disabled={!isAddress(transferTo)}
                  variant="outline"
                  onSuccess={() => {
                    setTransferTo("");
                    onRefresh();
                  }}
                />
              </div>
            </div>
          </>
        )}

        {pendingOp && pendingOp !== ZERO_ADDRESS && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-800 mb-1">
              Pending Operator Transfer
            </p>
            <p className="text-xs font-mono text-amber-700">{pendingOp}</p>
          </div>
        )}

        {isPendingOperator && (
          <ActionButton
            label="Accept Operator Role"
            functionName="acceptOperator"
            contractAddress={address}
            onSuccess={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
}
