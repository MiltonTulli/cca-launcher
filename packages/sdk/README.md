# @launcher/sdk

Typed SDK for interacting with Lagos launch contracts. Source of truth for ABIs, addresses, enums, and chain config used across the monorepo.

## Setup

```bash
# From repo root
pnpm install
```

## Usage

```ts
import {
  launchFactoryAbi,
  LAUNCH_FACTORY_ADDRESSES,
  LaunchState,
  getFactoryAddress,
} from "@launcher/sdk";

// Use ABI with viem/wagmi
const result = await publicClient.readContract({
  address: getFactoryAddress(11155111)!,
  abi: launchFactoryAbi,
  functionName: "getLaunchCount",
});

// Check launch state
if (state === LaunchState.AUCTION_ACTIVE) { ... }
```

### Sub-path imports

```ts
import { launchFactoryAbi } from "@launcher/sdk/abi";
import { sepoliaAddresses } from "@launcher/sdk/addresses";
import { LaunchState, TokenSource } from "@launcher/sdk/types";
import { getFactoryAddress, CHAIN_METADATA } from "@launcher/sdk/helpers";
```

## Regenerating ABIs

When contracts change, rebuild and re-export:

```bash
cd packages/contracts && forge build
cd packages/sdk && pnpm export-abis
```

This reads compiled artifacts from `packages/contracts/out/` and generates typed TS modules in `src/abi/`.

## Exported contracts

| Contract | Export name |
|---|---|
| LaunchFactory | `launchFactoryAbi` |
| LaunchOrchestrator | `launchOrchestratorAbi` |
| TokenFactory | `tokenFactoryAbi` |
| LaunchToken | `launchTokenAbi` |
| PostAuctionHandler | `postAuctionHandlerAbi` |
| LaunchLiquidityVault | `launchLiquidityVaultAbi` |
| LiquidityLockupFactory | `liquidityLockupFactoryAbi` |
| LiquidityLockup | `liquidityLockupAbi` |
| CCAAdapter | `ccaAdapterAbi` |
| OrchestratorDeployer | `orchestratorDeployerAbi` |
