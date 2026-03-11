// Auto-generated from packages/contracts — do not edit manually
// Run: pnpm --filter @launcher/sdk export-abis

export const orchestratorDeployerAbi = [
  {
    "type": "function",
    "name": "deploy",
    "inputs": [
      {
        "name": "launchId",
        "type": "uint256",
        "internalType": "uint256"
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
                "name": "auctionTickSpacing",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "reservePrice",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "requiredCurrencyRaised",
                "type": "uint128",
                "internalType": "uint128"
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
                "name": "tickSpacing",
                "type": "int24",
                "internalType": "int24"
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
        "name": "saleFeeBpsSnapshot",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "auctionInitializer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "postAuctionHandler",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "platformFeeRecipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "lpFeeShareBps",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [
      {
        "name": "orchestrator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  }
] as const;
