#!/usr/bin/env npx tsx
/**
 * Reads compiled Foundry artifacts from packages/contracts/out/
 * and generates typed ABI modules in packages/sdk/src/abi/.
 *
 * Usage:
 *   cd packages/sdk && npx tsx scripts/export-abis.ts
 *
 * Prerequisites:
 *   cd packages/contracts && forge build
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACTS_OUT = path.resolve(__dirname, "../../contracts/out");
const ABI_OUT = path.resolve(__dirname, "../src/abi");

/** Contracts to export — key = Solidity file/contract name, value = exported TS const name */
const CONTRACTS: Record<string, string> = {
  LaunchFactory: "launchFactoryAbi",
  LaunchOrchestrator: "launchOrchestratorAbi",
  TokenFactory: "tokenFactoryAbi",
  LaunchToken: "launchTokenAbi",
  PostAuctionHandler: "postAuctionHandlerAbi",
  LaunchLiquidityVault: "launchLiquidityVaultAbi",
  LiquidityLockupFactory: "liquidityLockupFactoryAbi",
  LiquidityLockup: "liquidityLockupAbi",
  CCAAdapter: "ccaAdapterAbi",
  OrchestratorDeployer: "orchestratorDeployerAbi",
};

function main() {
  if (!fs.existsSync(CONTRACTS_OUT)) {
    console.error(
      `❌ Foundry output not found at ${CONTRACTS_OUT}\n   Run: cd packages/contracts && forge build`,
    );
    process.exit(1);
  }

  fs.mkdirSync(ABI_OUT, { recursive: true });

  const exported: string[] = [];
  const skipped: string[] = [];

  for (const [contractName, varName] of Object.entries(CONTRACTS)) {
    const artifactPath = path.join(
      CONTRACTS_OUT,
      `${contractName}.sol`,
      `${contractName}.json`,
    );

    if (!fs.existsSync(artifactPath)) {
      skipped.push(contractName);
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const abi = artifact.abi;

    if (!abi || !Array.isArray(abi)) {
      skipped.push(contractName);
      continue;
    }

    const tsContent = [
      `// Auto-generated from packages/contracts — do not edit manually`,
      `// Run: pnpm --filter @launcher/sdk export-abis`,
      ``,
      `export const ${varName} = ${JSON.stringify(abi, null, 2)} as const;`,
      ``,
    ].join("\n");

    fs.writeFileSync(path.join(ABI_OUT, `${contractName}.ts`), tsContent);
    exported.push(contractName);
  }

  // Generate barrel index
  const indexLines = [
    `// Auto-generated — do not edit manually`,
    `// Run: pnpm --filter @launcher/sdk export-abis`,
    ``,
    ...exported.map(
      (name) => `export { ${CONTRACTS[name]} } from "./${name}";`,
    ),
    ``,
  ];
  fs.writeFileSync(path.join(ABI_OUT, "index.ts"), indexLines.join("\n"));

  console.log(`✅ Exported ${exported.length} ABIs: ${exported.join(", ")}`);
  if (skipped.length) {
    console.log(`⚠️  Skipped (not found): ${skipped.join(", ")}`);
  }
}

main();
