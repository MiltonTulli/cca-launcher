// Auto-generated from packages/contracts — do not edit manually
// Run: pnpm --filter @launcher/sdk export-abis

export const launchFactoryAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "platformAdmin_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "feeConfig_",
        "type": "tuple",
        "internalType": "struct PlatformFeeConfig",
        "components": [
          {
            "name": "feeRecipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "saleFeeBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "lpFeeShareBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "tokenCreationFee",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "orchestratorDeployer_",
        "type": "address",
        "internalType": "address"
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
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "acceptPlatformAdmin",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "auctionInitializer",
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
    "name": "createLaunch",
    "inputs": [
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
      }
    ],
    "outputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "launcherAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "feeConfig",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct PlatformFeeConfig",
        "components": [
          {
            "name": "feeRecipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "saleFeeBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "lpFeeShareBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "tokenCreationFee",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLaunch",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "getLaunchesByOperator",
    "inputs": [
      {
        "name": "operatorAddr",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "launchCount",
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
    "name": "launches",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "orchestratorDeployer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IOrchestratorDeployer"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingPlatformAdmin",
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
    "name": "platformAdmin",
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
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenFactory",
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
    "name": "transferPlatformAdmin",
    "inputs": [
      {
        "name": "newAdmin",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateAuctionInitializer",
    "inputs": [
      {
        "name": "newInitializer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateFeeConfig",
    "inputs": [
      {
        "name": "newConfig",
        "type": "tuple",
        "internalType": "struct PlatformFeeConfig",
        "components": [
          {
            "name": "feeRecipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "saleFeeBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "lpFeeShareBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "tokenCreationFee",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateOrchestratorDeployer",
    "inputs": [
      {
        "name": "newDeployer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updatePostAuctionHandler",
    "inputs": [
      {
        "name": "newHandler",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateTokenFactory",
    "inputs": [
      {
        "name": "newFactory",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "LaunchCreated",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "launch",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "paymentToken",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformAdminTransferStarted",
    "inputs": [
      {
        "name": "currentAdmin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "pendingAdmin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformAdminTransferred",
    "inputs": [
      {
        "name": "previousAdmin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newAdmin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformFeeConfigUpdated",
    "inputs": [
      {
        "name": "newConfig",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct PlatformFeeConfig",
        "components": [
          {
            "name": "feeRecipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "saleFeeBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "lpFeeShareBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "tokenCreationFee",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "NotPendingPlatformAdmin",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotPlatformAdmin",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  }
] as const;
