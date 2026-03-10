#!/usr/bin/env npx tsx
/**
 * Reads Foundry broadcast output from packages/contracts/broadcast/DeployAll.s.sol/{chainId}/run-latest.json
 * and updates the corresponding address file in packages/sdk/src/addresses/{chainName}.ts.
 *
 * Usage:
 *   cd packages/sdk && npx tsx scripts/export-addresses.ts
 *   cd packages/sdk && npx tsx scripts/export-addresses.ts --chain 11155111
 *
 * Prerequisites:
 *   A successful `forge script DeployAll.s.sol --broadcast` run for the target chain.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BROADCAST_DIR = path.resolve(
  __dirname,
  "../../contracts/broadcast/DeployAll.s.sol",
);
const ADDRESSES_DIR = path.resolve(__dirname, "../src/addresses");

/** Map chainId → address file name and exported const name */
const CHAINS: Record<
  number,
  { fileName: string; constName: string; label: string }
> = {
  1: {
    fileName: "mainnet",
    constName: "mainnetAddresses",
    label: "Mainnet (chainId: 1)",
  },
  11155111: {
    fileName: "sepolia",
    constName: "sepoliaAddresses",
    label: "Sepolia (chainId: 11155111)",
  },
  42161: {
    fileName: "arbitrum",
    constName: "arbitrumAddresses",
    label: "Arbitrum One (chainId: 42161)",
  },
  421614: {
    fileName: "arbitrumSepolia",
    constName: "arbitrumSepoliaAddresses",
    label: "Arbitrum Sepolia (chainId: 421614)",
  },
  84532: {
    fileName: "baseSepolia",
    constName: "baseSepoliaAddresses",
    label: "Base Sepolia (chainId: 84532)",
  },
  31337: {
    fileName: "localhost",
    constName: "localhostAddresses",
    label: "Localhost / Anvil (chainId: 31337)",
  },
};

/** Contracts deployed by DeployAll that we want to track */
const TRACKED_CONTRACTS = [
  "TokenFactory",
  "LiquidityLockup",
  "LiquidityLockupFactory",
  "PostAuctionHandler",
  "CCAAdapter",
  "OrchestratorDeployer",
  "LaunchFactory",
];

interface BroadcastTransaction {
  transactionType: string;
  contractName: string;
  contractAddress: string;
}

interface BroadcastFile {
  transactions: BroadcastTransaction[];
  chain: number;
}

function loadBroadcast(chainId: number): BroadcastFile | null {
  const filePath = path.join(
    BROADCAST_DIR,
    String(chainId),
    "run-latest.json",
  );
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function extractAddresses(
  broadcast: BroadcastFile,
): Record<string, string> {
  const addresses: Record<string, string> = {};
  for (const tx of broadcast.transactions) {
    if (
      tx.transactionType === "CREATE" &&
      TRACKED_CONTRACTS.includes(tx.contractName)
    ) {
      addresses[tx.contractName] = tx.contractAddress.toLowerCase();
    }
  }
  return addresses;
}

function generateAddressFile(
  chainMeta: { constName: string; label: string },
  addresses: Record<string, string>,
): string {
  const lines = [
    `// Auto-generated from broadcast output — do not edit manually`,
    `// Run: pnpm --filter @launcher/sdk export-addresses`,
    ``,
    `/** ${chainMeta.label} deployed contract addresses */`,
    `export const ${chainMeta.constName} = {`,
  ];

  for (const name of TRACKED_CONTRACTS) {
    if (addresses[name]) {
      lines.push(`  ${name}: "${addresses[name]}",`);
    }
  }

  lines.push(`} as const;`, ``);
  return lines.join("\n");
}

function updateIndexFile(exportedChains: number[]) {
  // Collect all chain files that exist (exported now + previously existing)
  const allChainEntries: { chainId: number; fileName: string; constName: string }[] = [];

  for (const [chainIdStr, meta] of Object.entries(CHAINS)) {
    const filePath = path.join(ADDRESSES_DIR, `${meta.fileName}.ts`);
    if (fs.existsSync(filePath)) {
      allChainEntries.push({
        chainId: Number(chainIdStr),
        fileName: meta.fileName,
        constName: meta.constName,
      });
    }
  }

  // Read the current index to preserve LAUNCH_FACTORY_ADDRESSES and other logic
  const currentIndex = fs.existsSync(path.join(ADDRESSES_DIR, "index.ts"))
    ? fs.readFileSync(path.join(ADDRESSES_DIR, "index.ts"), "utf-8")
    : "";

  // Rebuild re-exports
  const reExports = allChainEntries
    .map((e) => `export { ${e.constName} } from "./${e.fileName}";`)
    .join("\n");

  // Preserve everything after the re-exports (LAUNCH_FACTORY_ADDRESSES, etc.)
  // Find where the non-export content starts
  const lines = currentIndex.split("\n");
  const firstNonExportIdx = lines.findIndex(
    (line) => line.trim() !== "" && !line.startsWith("export {"),
  );

  const restOfFile =
    firstNonExportIdx >= 0 ? lines.slice(firstNonExportIdx).join("\n") : "";

  const indexContent = [reExports, "", restOfFile].join("\n");

  fs.writeFileSync(path.join(ADDRESSES_DIR, "index.ts"), indexContent);
}

function main() {
  const args = process.argv.slice(2);
  const chainFlagIdx = args.indexOf("--chain");
  const targetChainIds: number[] = [];

  if (chainFlagIdx >= 0 && args[chainFlagIdx + 1]) {
    targetChainIds.push(Number(args[chainFlagIdx + 1]));
  } else {
    // Auto-discover all chains with broadcast output
    if (fs.existsSync(BROADCAST_DIR)) {
      for (const entry of fs.readdirSync(BROADCAST_DIR)) {
        const chainId = Number(entry);
        if (!Number.isNaN(chainId) && CHAINS[chainId]) {
          targetChainIds.push(chainId);
        }
      }
    }
  }

  if (targetChainIds.length === 0) {
    console.error(
      `❌ No broadcast output found at ${BROADCAST_DIR}\n   Run: cd packages/contracts && forge script script/DeployAll.s.sol --broadcast`,
    );
    process.exit(1);
  }

  const exported: string[] = [];
  const skipped: string[] = [];

  for (const chainId of targetChainIds) {
    const chainMeta = CHAINS[chainId];
    if (!chainMeta) {
      skipped.push(`${chainId} (unknown chain)`);
      continue;
    }

    const broadcast = loadBroadcast(chainId);
    if (!broadcast) {
      skipped.push(`${chainId} (no broadcast file)`);
      continue;
    }

    const addresses = extractAddresses(broadcast);
    if (Object.keys(addresses).length === 0) {
      skipped.push(`${chainId} (no CREATE transactions)`);
      continue;
    }

    const content = generateAddressFile(chainMeta, addresses);
    const outPath = path.join(ADDRESSES_DIR, `${chainMeta.fileName}.ts`);
    fs.writeFileSync(outPath, content);

    exported.push(
      `${chainMeta.label} → ${chainMeta.fileName}.ts (${Object.keys(addresses).length} contracts)`,
    );
  }

  if (exported.length > 0) {
    updateIndexFile(targetChainIds);
  }

  console.log(
    `✅ Exported addresses for ${exported.length} chain(s):\n   ${exported.join("\n   ")}`,
  );
  if (skipped.length) {
    console.log(`⚠️  Skipped: ${skipped.join(", ")}`);
  }
}

main();
