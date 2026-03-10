// Auto-generated from packages/contracts — do not edit manually
// Run: pnpm --filter @launcher/sdk export-abis

export const launchOrchestratorAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "launchId_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "factory_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct LaunchParams",
        "components": [
          {
            "name": "tokenSource",
            "type": "uint8",
            "internalType": "enum TokenSource"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "paymentToken",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "operator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "auctionConfig",
            "type": "tuple",
            "internalType": "struct AuctionConfig",
            "components": [
              {
                "name": "startBlock",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "endBlock",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "claimBlock",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "reservePrice",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "auctionStepsData",
                "type": "bytes",
                "internalType": "bytes"
              },
              {
                "name": "validationHook",
                "type": "address",
                "internalType": "address"
              }
            ]
          },
          {
            "name": "tokenAllocation",
            "type": "tuple",
            "internalType": "struct TokenAllocation",
            "components": [
              {
                "name": "auctionTokenAmount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "liquidityTokenAmount",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "liquidityConfig",
            "type": "tuple",
            "internalType": "struct LiquidityProvisionConfig",
            "components": [
              {
                "name": "enabled",
                "type": "bool",
                "internalType": "bool"
              },
              {
                "name": "proceedsToLiquidityBps",
                "type": "uint16",
                "internalType": "uint16"
              },
              {
                "name": "positionBeneficiary",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "poolFee",
                "type": "uint24",
                "internalType": "uint24"
              },
              {
                "name": "tickLower",
                "type": "int24",
                "internalType": "int24"
              },
              {
                "name": "tickUpper",
                "type": "int24",
                "internalType": "int24"
              },
              {
                "name": "lockupEnabled",
                "type": "bool",
                "internalType": "bool"
              },
              {
                "name": "lockupDuration",
                "type": "uint64",
                "internalType": "uint64"
              }
            ]
          },
          {
            "name": "settlementConfig",
            "type": "tuple",
            "internalType": "struct SettlementConfig",
            "components": [
              {
                "name": "treasury",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "permissionlessDistributionDelay",
                "type": "uint64",
                "internalType": "uint64"
              }
            ]
          },
          {
            "name": "metadataHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "name": "saleFeeBpsSnapshot_",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "auctionInitializer_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "postAuctionHandler_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenFactory_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "platformFeeRecipient_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "lpFeeShareBps_",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "acceptOperator",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "auctionEndBlock",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "auctionEndBlockConfig",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "auctionInitializer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IAuctionInitializer"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "auctionStartBlock",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "auctionStepsData",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "auctionTokenAmount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cancel",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cca",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "claimBlock",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createToken",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct TokenCreationParams",
        "components": [
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "symbol",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "decimals",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "initialSupply",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "initialHolder",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "distributionTimestamp",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "factory",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "finalizeSetup",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getState",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum LaunchState"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isDistributionPermissionless",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "launchId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "liquidityEnabled",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "liquidityInfo",
    "inputs": [],
    "outputs": [
      {
        "name": "state",
        "type": "uint8",
        "internalType": "enum LiquidityState"
      },
      {
        "name": "vault",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "lockup",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "positionTokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "unlockTimestamp",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "liquidityTokenAmount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lockupDuration",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lockupEnabled",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lpFeeShareBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "metadataHash",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "operator",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "paymentToken",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingOperator",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "permissionlessDistributionDelay",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "platformFeeRecipient",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "poolFee",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint24",
        "internalType": "uint24"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "positionBeneficiary",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "postAuctionHandler",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IPostAuctionHandler"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proceedsToLiquidityBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "processDistribution",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "reservePrice",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "saleFeeBpsSnapshot",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "settleAuction",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "state",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum LaunchState"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "sweepPaymentToken",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "sweepToken",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "tickLower",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "int24",
        "internalType": "int24"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tickUpper",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "int24",
        "internalType": "int24"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "token",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenFactoryContract",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract ITokenFactory"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenSource",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum TokenSource"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokensSold",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalRaised",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOperator",
    "inputs": [
      {
        "name": "newOperator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "treasuryAddress",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "validationHook",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "AuctionFailed",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "reason",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AuctionSettled",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "totalRaised",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "tokensSold",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DistributionComplete",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "saleFee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "liquidityAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "treasuryAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LaunchCancelled",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OperatorTransferStarted",
    "inputs": [
      {
        "name": "currentOperator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "pendingOperator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OperatorTransferred",
    "inputs": [
      {
        "name": "previousOperator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOperator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PaymentTokenSwept",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetupFinalized",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "cca",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "endBlock",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TokenCreated",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TokenSwept",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AuctionNotEnded",
    "inputs": [
      {
        "name": "currentBlock",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "endBlock",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "AuctionSupplyMustBePositive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DistributionNotPermissionless",
    "inputs": [
      {
        "name": "currentBlock",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "permissionlessBlock",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientTokenBalance",
    "inputs": [
      {
        "name": "required",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "actual",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidAddress",
    "inputs": [
      {
        "name": "param",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidState",
    "inputs": [
      {
        "name": "current",
        "type": "uint8",
        "internalType": "enum LaunchState"
      },
      {
        "name": "required",
        "type": "uint8",
        "internalType": "enum LaunchState"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidTokenSource",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyOperator",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
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
  },
  {
    "type": "error",
    "name": "TokenAlreadyCreated",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenNotCreated",
    "inputs": []
  }
] as const;
