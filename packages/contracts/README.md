# CCA Launcher - Smart Contracts

A modular smart contract system for launching ERC20 tokens via **Continuous Clearing Auctions (CCA)** on Uniswap V4, with automated liquidity provisioning, LP position lockup, and platform fee collection.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Contract Map](#contract-map)
- [State Machine](#state-machine)
- [Token Sources](#token-sources)
- [Auction Lifecycle](#auction-lifecycle)
- [Liquidity Management](#liquidity-management)
- [Platform Fees](#platform-fees)
- [Data Structures](#data-structures)
- [Deployed Addresses](#deployed-addresses)
- [Development](#development)
- [Security Considerations](#security-considerations)

---

## Overview

CCA Launcher enables token creators to:

1. **Configure** a token launch with auction parameters, liquidity settings, and fee splits
2. **Run** a fair-price-discovery auction via Uniswap's CCA mechanism (block-based, with clearing price)
3. **Bootstrap liquidity** automatically by creating a Uniswap V4 pool at the clearing price
4. **Lock** the LP position for a configurable duration to signal long-term commitment
5. **Collect** LP trading fees with automatic platform/creator splits

The system is designed around a strict state machine with immutable configuration per launch, two-step ownership transfers, and separation of concerns between auction, liquidity, and fee management.

---

## Architecture

```
                          ┌─────────────────────┐
                          │    LaunchFactory     │
                          │                      │
                          │  - Platform config   │
                          │  - Launch registry   │
                          │  - Fee settings      │
                          └──────────┬───────────┘
                                     │ createLaunch()
                                     ▼
┌──────────────┐         ┌─────────────────────────┐         ┌──────────────┐
│ TokenFactory │◄────────│   LaunchOrchestrator     │────────►│  CCAAdapter  │
│              │         │                          │         │              │
│ CREATE_NEW   │         │  Per-launch coordinator  │         │ Deploys CCA  │
│ token deploy │         │  State machine owner     │         │ via factory  │
└──────────────┘         └────────────┬────────────┘         └──────┬───────┘
                                      │                             │
                                      │ processDistribution()      │
                                      ▼                             ▼
                          ┌─────────────────────┐         ┌──────────────────┐
                          │ PostAuctionHandler   │         │   CCA Contract   │
                          │                      │         │                  │
                          │ - Init V4 pool       │         │ - Price discovery│
                          │ - Mint LP position   │         │ - Bid management │
                          │ - Deploy vault       │         │ - Clearing price │
                          │ - Deploy lockup      │         └──────────────────┘
                          └──────────┬───────────┘
                                     │
                          ┌──────────┴───────────┐
                          │                      │
                          ▼                      ▼
               ┌──────────────────┐   ┌──────────────────────┐
               │ LiquidityVault   │   │  LiquidityLockup     │
               │                  │   │                      │
               │ - Holds LP NFT   │   │ - Time-based lock    │
               │ - Collects fees  │   │ - Blocks withdrawal  │
               │ - Splits revenue │   │   until expiry       │
               └──────────────────┘   └──────────────────────┘
```

### Key Design Principles

- **Immutable per-launch config**: All parameters are set at deployment and cannot be changed. This prevents rug-pull vectors and ensures auction participants can trust the terms.
- **Strict state machine**: Each launch progresses through well-defined states. Invalid transitions revert.
- **Separation of concerns**: Auction logic (CCA), liquidity creation (PostAuctionHandler), fee custody (Vault), and lockup (LiquidityLockup) are independent contracts.
- **Two-step ownership**: Both operator and platform admin roles use a propose-accept pattern to prevent accidental transfers.
- **Adapter pattern**: CCAAdapter decouples the orchestrator from Uniswap CCA internals, allowing the auction mechanism to be upgraded independently.

---

## Contract Map

```
src/
├── LaunchOrchestrator.sol        # Per-launch lifecycle coordinator
├── LaunchFactory.sol              # Launch creation & platform config registry
├── PostAuctionHandler.sol         # Uniswap V4 pool + LP position creation
├── LaunchLiquidityVault.sol       # LP position custody & fee collection
├── LaunchToken.sol                # ERC20 with minter role (for CREATE_NEW)
├── TokenFactory.sol               # Token deployment factory
├── LiquidityLockup.sol            # Timestamp-based position lock
├── LiquidityLockupFactory.sol     # Minimal clone factory for lockups
├── OrchestratorDeployer.sol       # Orchestrator instance deployer
├── CCAAdapter.sol                 # Uniswap CCA wrapper
├── interfaces/
│   ├── ILaunchOrchestrator.sol
│   ├── ILaunchFactory.sol
│   ├── IPostAuctionHandler.sol
│   ├── ILaunchLiquidityVault.sol
│   ├── ILiquidityLockup.sol
│   ├── IAuctionInitializer.sol
│   ├── IOrchestratorDeployer.sol
│   ├── ITokenFactory.sol
│   └── ICCA.sol                   # Read-only CCA interface
├── lib/
│   ├── CurrencyLib.sol            # ETH/ERC20 transfer abstraction
│   ├── PriceLib.sol               # CCA price → sqrtPriceX96 conversion
│   └── PoolKeyLib.sol             # V4 PoolKey construction & tick math
├── types/
│   └── LaunchTypes.sol            # All structs and enums
└── errors/
    └── LaunchErrors.sol           # Custom error definitions
```

### Contract Descriptions

| Contract | Purpose |
|----------|---------|
| **LaunchOrchestrator** | Per-launch coordinator. Manages the full lifecycle from setup through distribution. Holds all immutable config and enforces state transitions. |
| **LaunchFactory** | Registry and entry point. Deploys orchestrator instances, stores global platform fee config, tracks launches by operator. |
| **PostAuctionHandler** | Creates Uniswap V4 pool at clearing price, mints full-range LP position, deploys vault and optional lockup. |
| **LaunchLiquidityVault** | Custodian of the LP position NFT. Collects Uniswap trading fees and splits between platform and creator. |
| **LaunchToken** | ERC20 with `MINTER_ROLE` access control. Used when `tokenSource = CREATE_NEW`. |
| **TokenFactory** | Deploys `LaunchToken` instances via CREATE2. Collects flat ETH creation fee. |
| **LiquidityLockup** | Minimal timestamp-based lock. Blocks vault withdrawal until expiry. Deployed as clone. |
| **LiquidityLockupFactory** | OpenZeppelin Clones factory for `LiquidityLockup` instances. |
| **OrchestratorDeployer** | Thin deployer for `LaunchOrchestrator` instances. Allows template upgrades. |
| **CCAAdapter** | Implements `IAuctionInitializer`. Wraps Uniswap CCA factory, provisions tokens, and notifies CCA. |

---

## State Machine

### LaunchState

The on-chain state enum for each launch:

```
Value  State           Description
─────  ──────────────  ────────────────────────────────────────────────
  0    SETUP           Initial configuration phase
  1    FINALIZED       CCA deployed, tokens provisioned, auction pending
  2    AUCTION_ENDED   Auction settled, awaiting distribution
  3    DISTRIBUTED     Proceeds distributed, LP created (if enabled)
  4    CANCELLED       Operator cancelled during SETUP (terminal)
  5    AUCTION_FAILED  Auction did not graduate (terminal)
```

> **Note**: `AUCTION_ACTIVE` is not stored on-chain. The UI derives it from `FINALIZED` + `currentBlock ∈ [startBlock, endBlock)`.

### State Transition Diagram

```
                    ┌──────────────────────────────────┐
                    │           SETUP (0)               │
                    │                                    │
                    │  createToken()  [if CREATE_NEW]    │
                    │  cancel() ──────────────────────┐  │
                    │  finalizeSetup() ────────────┐  │  │
                    └──────────────────────────────┘│  │  │
                                                   │  │  │
              ┌────────────────────────────────────▼┘  │  │
              │                                        │  │
              │         FINALIZED (1)                   │  │
              │                                        │  │
              │  Auction runs: startBlock → endBlock    │  │
              │  UI derives "Auction Active" here       │  │
              │                                        │  │
              │  settleAuction() ──────────────────┐   │  │
              └────────────────────────────────────┘│   │  │
                              │                     │   │  │
                   ┌──────────┘                     │   │  │
                   │                                │   │  │
         ┌─────────▼──────────┐    ┌────────────────▼──┐│  │
         │ AUCTION_ENDED (2)  │    │ AUCTION_FAILED (5)││  │
         │                    │    │                    ││  │
         │ processDistribution│    │  Terminal state    ││  │
         │ (operator or       │    │  Tokens returned   ││  │
         │  permissionless)   │    └────────────────────┘│  │
         └────────┬───────────┘                          │  │
                  │                                      │  │
                  ▼                                      │  │
         ┌────────────────────┐    ┌────────────────────┐│  │
         │  DISTRIBUTED (3)   │    │  CANCELLED (4)     │◄──┘
         │                    │    │                    │
         │  sweepToken()      │    │  Terminal state    │
         │  sweepPayment()    │    │  Tokens refunded   │
         │  vault.collect()   │    └────────────────────┘
         │  vault.withdraw()  │
         └────────────────────┘
```

### Transition Functions

| From | To | Function | Who Can Call |
|------|----|----------|-------------|
| SETUP | FINALIZED | `finalizeSetup()` | Operator |
| SETUP | CANCELLED | `cancel()` | Operator |
| FINALIZED | AUCTION_ENDED | `settleAuction()` | Anyone (after endBlock) |
| FINALIZED | AUCTION_FAILED | `settleAuction()` | Anyone (after endBlock, if auction didn't graduate) |
| AUCTION_ENDED | DISTRIBUTED | `processDistribution()` | Operator immediately, or anyone after `permissionlessDistributionDelay` blocks |

### LiquidityState

Tracked per-launch in `LiquidityInfo`, only relevant after `DISTRIBUTED`:

```
Value  State       Description
─────  ──────────  ──────────────────────────────────────────────
  0    NONE        No liquidity provisioning (disabled or skipped)
  1    LOCKED      LP position created and locked until expiry
  2    UNLOCKED    Lock expired, position can be withdrawn
  3    WITHDRAWN   Position has been withdrawn from vault
```

---

## Token Sources

The `TokenSource` enum determines how the launch token is provided to the auction:

| Value | Name | Description | Token Address |
|-------|------|-------------|---------------|
| 0 | `EXISTING_BALANCE` | Tokens already deposited in the orchestrator contract | Set at creation |
| 1 | `EXISTING_TRANSFER_FROM` | Pulled from operator via `transferFrom` (requires prior approval) | Set at creation |
| 2 | `CREATE_NEW` | Minted via `TokenFactory` during setup phase | Set via `createToken()` |

### CREATE_NEW Flow

When using `CREATE_NEW`, the launch is created with `token = address(0)`. The operator must then:

1. Call `createToken(params)` on the orchestrator (payable — covers the token creation fee)
2. The orchestrator deploys a `LaunchToken` via `TokenFactory`
3. The new token is minted with `initialSupply` and the orchestrator is granted `MINTER_ROLE`
4. The operator then calls `finalizeSetup()` to proceed

---

## Auction Lifecycle

### Block-Based Timing

All auction timing uses **block numbers**, not timestamps:

| Parameter | Type | Description |
|-----------|------|-------------|
| `startBlock` | `uint64` | Block when bidding opens |
| `endBlock` | `uint64` | Block when bidding closes |
| `claimBlock` | `uint64` | Block after which winners can claim tokens |

### CCA Integration

The Continuous Clearing Auction mechanism (from Uniswap) provides:

- **Continuous clearing**: The clearing price adjusts as new bids arrive
- **Price discovery**: Bidders specify a maximum price; the auction finds the market-clearing price
- **Graduation threshold**: Optional `requiredCurrencyRaised` — if not met, the auction fails
- **Tick spacing**: Controls price granularity (`auctionTickSpacing`, distinct from Uniswap V4 pool tick spacing)

### Auction Settlement

After `endBlock`, anyone can call `settleAuction()`:

1. Calls `checkpoint()` on the CCA to finalize the clearing price
2. Checks if the auction **graduated** (met required raise, had bids)
3. If graduated: sweeps unsold tokens and currency from CCA, state → `AUCTION_ENDED`
4. If not graduated: state → `AUCTION_FAILED` (terminal), unsold tokens swept back

### Distribution

After settlement, `processDistribution()` handles:

1. **Sale fee**: Deducts `saleFeeBps` from total raised, sends to platform fee recipient
2. **Liquidity creation** (if enabled): Calls `PostAuctionHandler` with the configured token + currency amounts
3. **Treasury payout**: Remaining proceeds sent to the configured treasury address

Distribution access control:
- **Operator**: Can call immediately after settlement
- **Anyone (permissionless)**: Can call after `permissionlessDistributionDelay` blocks have passed since `auctionEndBlock`

---

## Liquidity Management

### PostAuctionHandler

When liquidity is enabled, `PostAuctionHandler.createLiquidityPosition()`:

1. Pulls tokens and payment currency from the orchestrator
2. Initializes a Uniswap V4 pool at the clearing price (using `PriceLib` to convert CCA Q96 → sqrtPriceX96)
3. Mints a **full-range LP position** via PositionManager
4. Deploys a `LaunchLiquidityVault` clone to custody the LP NFT
5. If lockup is enabled, deploys a `LiquidityLockup` clone
6. Returns unused tokens to the caller

### LaunchLiquidityVault

The vault is the custodian of the LP position NFT:

- **`collectAndSplitFees()`** — Permissionless. Collects accumulated Uniswap V4 trading fees and splits them:
  - `platformFeeBps` share → platform beneficiary
  - Remainder → creator beneficiary (`positionBeneficiary`)
- **`withdrawPosition(recipient)`** — Owner-only. Transfers the LP NFT out. Blocked if lockup is active.
- **`isWithdrawable()`** — Returns true if no lockup exists or lockup has expired.

### LiquidityLockup

A minimal timestamp-based lock:

- Deployed as a clone via `LiquidityLockupFactory`
- `isUnlocked()` returns true when `block.timestamp >= unlockTimestamp`
- `unlock()` marks the lockup as unlocked (callable by anyone after expiry)
- The vault checks lockup status before allowing position withdrawal

---

## Platform Fees

Fees are configured globally on `LaunchFactory` and **snapshotted** per launch at creation time:

```solidity
struct PlatformFeeConfig {
    address feeRecipient;       // Receives sale fees and LP fee share
    uint16  saleFeeBps;         // Fee on auction proceeds (e.g., 500 = 5%)
    uint16  lpFeeShareBps;      // Platform share of LP swap fees (e.g., 1500 = 15%)
    uint256 tokenCreationFee;   // Flat ETH fee for CREATE_NEW tokens
}
```

| Fee Type | When Collected | Calculation |
|----------|----------------|-------------|
| Sale fee | During `processDistribution()` | `totalRaised * saleFeeBps / 10_000` |
| LP fee share | On each `vault.collectAndSplitFees()` | `tradingFees * lpFeeShareBps / 10_000` |
| Token creation | During `createToken()` | Flat ETH amount forwarded to `feeRecipient` |

> Fees are **snapshotted at launch creation**. Subsequent changes to the factory's fee config do not affect existing launches.

---

## Data Structures

### LaunchParams (top-level)

```solidity
struct LaunchParams {
    TokenSource tokenSource;
    address token;                           // address(0) for CREATE_NEW
    address paymentToken;                    // ERC20 or address(0) for native ETH
    address operator;
    AuctionConfig auctionConfig;
    TokenAllocation tokenAllocation;
    LiquidityProvisionConfig liquidityConfig;
    SettlementConfig settlementConfig;
    bytes32 metadataHash;                    // Off-chain metadata pointer
}
```

### AuctionConfig

```solidity
struct AuctionConfig {
    uint64  startBlock;
    uint64  endBlock;
    uint64  claimBlock;
    uint256 auctionTickSpacing;              // CCA price increment granularity
    uint256 reservePrice;                    // Maps to CCA floorPrice
    uint128 requiredCurrencyRaised;          // Graduation threshold (0 = none)
    bytes   auctionStepsData;                // Encoded price step configuration
    address validationHook;                  // Optional bid validation contract
}
```

### TokenAllocation

```solidity
struct TokenAllocation {
    uint256 auctionTokenAmount;              // Tokens allocated to auction
    uint256 liquidityTokenAmount;            // Tokens allocated to LP bootstrapping
}
```

### LiquidityProvisionConfig

```solidity
struct LiquidityProvisionConfig {
    bool    enabled;
    uint16  proceedsToLiquidityBps;          // % of auction proceeds allocated to LP
    address positionBeneficiary;             // Receives LP fees + unlocked position
    uint24  poolFee;                         // Uniswap V4 fee tier (e.g., 3000 = 0.30%)
    int24   tickSpacing;                     // V4 pool tick spacing
    int24   tickLower;                       // LP range lower bound
    int24   tickUpper;                       // LP range upper bound
    bool    lockupEnabled;
    uint64  lockupDuration;                  // In seconds (timestamp-based)
}
```

### SettlementConfig

```solidity
struct SettlementConfig {
    address treasury;                        // Receives auction proceeds after fees
    uint64  permissionlessDistributionDelay; // Blocks after endBlock before anyone can distribute
}
```

### LiquidityInfo

```solidity
struct LiquidityInfo {
    LiquidityState state;
    address vault;                           // LaunchLiquidityVault address
    address lockup;                          // LiquidityLockup address (or address(0))
    uint256 positionTokenId;                 // Uniswap V4 LP NFT token ID
    uint64  unlockTimestamp;                 // When position can be withdrawn
}
```

### TokenCreationParams

```solidity
struct TokenCreationParams {
    string  name;
    string  symbol;
    uint8   decimals;
    uint256 initialSupply;
    address initialHolder;                   // Typically the orchestrator itself
}
```

### VaultConfig

```solidity
struct VaultConfig {
    address platformBeneficiary;
    address creatorBeneficiary;
    uint16  platformFeeBps;                  // e.g., 1500 = 15%
}
```

---

## Deployed Addresses

### Sepolia Testnet

| Contract | Address |
|----------|---------|
| **LaunchFactory** | [`0x484c...9319`](https://sepolia.etherscan.io/address/0x484c60c320b656c28fc997c5a930b30da8c39319) |
| OrchestratorDeployer | [`0x90b3...2f2a`](https://sepolia.etherscan.io/address/0x90b36f64c6d646742910f525b91847a3d6092f2a) |
| CCAAdapter | [`0xf9f3...3e01`](https://sepolia.etherscan.io/address/0xf9f35a0372f6850143c4ec9f84efad368e473e01) |
| PostAuctionHandler | [`0xa443...fec0`](https://sepolia.etherscan.io/address/0xa443593036f9fed1f0881ad32fe2a5868e1bfec0) |
| TokenFactory | [`0x4149...f274`](https://sepolia.etherscan.io/address/0x4149c11c5f8386c425ad5f12eaaa08c90f69f274) |
| LiquidityLockupFactory | [`0x086b...74b7`](https://sepolia.etherscan.io/address/0x086b0e07248403dfb167882505a5a1ce1e9874b7) |
| LiquidityLockup (impl) | [`0x32d4...cab3`](https://sepolia.etherscan.io/address/0x32d44b17ab06f53a08dd9bb1903ce5b08ad8cab3) |

> Each `createLaunch()` deploys a new `LaunchOrchestrator` instance at a unique address.

---

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/) (forge, cast, anvil)
- Solidity 0.8.26
- EVM target: Cancun

### Build

```shell
forge build
```

### Test

```shell
# Unit tests (excludes fork tests by default)
forge test

# With verbosity
forge test -vvv

# Fork tests (requires RPC endpoint)
forge test --match-path "test/fork/*" --fork-url $SEPOLIA_RPC_URL
```

### Format

```shell
forge fmt
```

### Gas Snapshots

```shell
forge snapshot
```

### Deploy

Full deployment (all infrastructure contracts):

```shell
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

#### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEPLOYER_PRIVATE_KEY` | Yes | Deployer account private key |
| `PLATFORM_ADMIN` | Yes | Platform admin address |
| `PLATFORM_FEE_RECIPIENT` | Yes | Fee recipient address |
| `SALE_FEE_BPS` | No | Sale fee in basis points (default: 500 = 5%) |
| `LP_FEE_SHARE_BPS` | No | LP fee share in basis points (default: 1500 = 15%) |
| `TOKEN_CREATION_FEE` | No | Token creation fee in wei (default: 0.001 ether) |

---

## Security Considerations

### Access Control

- **Operator** (per-launch): Can finalize setup, cancel, distribute, sweep tokens, withdraw LP position, transfer role.
- **Platform Admin** (global): Can update fee config, update infrastructure contracts, transfer admin role.
- Both use **two-step transfer** (propose → accept) to prevent accidental loss of control.

### Reentrancy Protection

`LaunchOrchestrator` and `LaunchLiquidityVault` use OpenZeppelin's `ReentrancyGuard` on all state-changing functions that transfer tokens.

### Immutable Configuration

All launch parameters are set at deployment and stored as immutable/constant values:

- Auction terms cannot be changed after creation
- Fee percentages are snapshotted from the factory at launch time
- Token allocations are fixed

### Emergency Recovery

`emergencyRescue(tokenAddress)` allows recovering stuck tokens:

- In **terminal states** (DISTRIBUTED, CANCELLED, AUCTION_FAILED): available immediately
- In **non-terminal states**: available after `2 * permissionlessDistributionDelay` blocks
- Only callable by the operator
- Sends recovered tokens to the configured treasury address

### Native ETH Support

The system fully supports native ETH as the payment token (`paymentToken = address(0)`). The `CurrencyLib` library handles ERC20/ETH abstraction transparently across all contracts.

---

## License

MIT
