# Tally Launcher

A monorepo for the Tally token launch platform on Uniswap V4, including smart contracts, a TypeScript SDK, and a web application.

## Repository Structure

```
├── apps/
│   └── web/                 # Next.js web application
├── packages/
│   ├── contracts/           # Solidity smart contracts (Foundry)
│   └── sdk/                 # TypeScript SDK (ABIs, addresses, types)
```

### `packages/contracts`

Foundry-based smart contracts for the launch platform:

- **LaunchFactory** – Factory for creating launches
- **LaunchOrchestrator** – Main orchestration contract (auction lifecycle)
- **LaunchToken / TokenFactory** – ERC-20 token creation
- **PostAuctionHandler** – Post-auction distribution logic
- **LaunchLiquidityVault** – Liquidity management
- **LiquidityLockup / LiquidityLockupFactory** – LP position lockup
- **CCAAdapter** – Community CCA adapter

Solidity 0.8.26, EVM target: `cancun`.

### `packages/sdk`

Typed TypeScript SDK consumed by the web app and other clients:

- `@launcher/sdk/abi` – Auto-generated ABIs from Foundry artifacts
- `@launcher/sdk/addresses` – Per-chain deployed contract addresses
- `@launcher/sdk/types` – Shared types and enums (e.g. `LaunchState`)
- `@launcher/sdk/helpers` – Address utilities and chain metadata

### `apps/web`

Next.js 15 (App Router) frontend for creating and managing launches.

**Key dependencies:** React 19, wagmi v2, viem, Reown AppKit, Tailwind CSS, shadcn/ui, Upstash Redis, Tenderly.

**Features:**
- Create and configure token launches
- Browse and bid on auctions
- Draft management with Redis persistence
- Transaction simulation via Tenderly
- Multi-chain viewing (view launches on any supported chain without switching wallet)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.26, Foundry |
| SDK | TypeScript, viem |
| Frontend | Next.js 15, React 19, wagmi v2 |
| Styling | Tailwind CSS, shadcn/ui |
| Wallet | Reown AppKit (WalletConnect) |
| Linting | Biome |
| Package Manager | pnpm (workspaces) |
| Data | Upstash Redis, Tenderly |

## Supported Networks

- Ethereum Mainnet
- Sepolia
- Base Sepolia

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for contracts development)

### Installation

```bash
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

Required variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | [Reown Cloud](https://cloud.reown.com) project ID |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis credentials |
| `TENDERLY_ACCESS_KEY` / `TENDERLY_ACCOUNT_SLUG` / `TENDERLY_PROJECT_SLUG` | Tenderly simulation |
| `PERMIT_SIGNER_PRIVATE_KEY` | Server-side permit signer |

### Development

```bash
# Start the web app (port 3002)
pnpm dev:web

# Build the web app
pnpm build

# Lint
pnpm lint

# Type-check
pnpm typecheck
```

### Contracts

```bash
cd packages/contracts

# Build contracts
forge build

# Run tests
forge test

# Export ABIs to SDK (from repo root)
pnpm export-abis
```

## License

MIT
