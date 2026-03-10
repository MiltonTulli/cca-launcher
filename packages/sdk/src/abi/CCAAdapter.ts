// Auto-generated from packages/contracts — do not edit manually
// Run: pnpm --filter @launcher/sdk export-abis

export const ccaAdapterAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "ccaFactory_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ccaFactory",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IContinuousClearingAuctionFactory"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createAuction",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "configData",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "cca",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const;
