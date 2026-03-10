// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

import {TokenFactory} from "../src/TokenFactory.sol";
import {LaunchFactory} from "../src/LaunchFactory.sol";
import {OrchestratorDeployer} from "../src/OrchestratorDeployer.sol";
import {PostAuctionHandler} from "../src/PostAuctionHandler.sol";
import {LiquidityLockup} from "../src/LiquidityLockup.sol";
import {LiquidityLockupFactory} from "../src/LiquidityLockupFactory.sol";
import {CCAAdapter} from "../src/CCAAdapter.sol";
import {PlatformFeeConfig} from "../src/types/LaunchTypes.sol";

/// @title DeployAll
/// @notice Deploys the full contract suite in the correct order
/// @dev Usage:
///   forge script script/DeployAll.s.sol:DeployAll \
///     --rpc-url sepolia \
///     --broadcast \
///     --verify \
///     -vvvv
///
/// Required env vars:
///   DEPLOYER_PRIVATE_KEY  — private key of the deployer
///   PLATFORM_ADMIN        — address of the platform admin
///   PLATFORM_FEE_RECIPIENT — address to receive platform fees
///   CCA_FACTORY           — address of the CCA factory on target chain
///   POOL_MANAGER          — address of Uniswap V4 PoolManager
///   POSITION_MANAGER      — address of Uniswap V4 PositionManager
///
/// Optional env vars:
///   SALE_FEE_BPS          — sale fee in bps (default: 500 = 5%)
///   LP_FEE_SHARE_BPS      — LP fee share in bps (default: 1500 = 15%)
///   TOKEN_CREATION_FEE    — fee in wei for token creation (default: 0.001 ether)
contract DeployAll is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address platformAdmin = vm.envAddress("PLATFORM_ADMIN");
        address feeRecipient = vm.envAddress("PLATFORM_FEE_RECIPIENT");
        address ccaFactoryAddr = vm.envAddress("CCA_FACTORY");
        address poolManager = vm.envAddress("POOL_MANAGER");
        address positionManager = vm.envAddress("POSITION_MANAGER");

        uint16 saleFeeBps = uint16(vm.envOr("SALE_FEE_BPS", uint256(500)));
        uint16 lpFeeShareBps = uint16(vm.envOr("LP_FEE_SHARE_BPS", uint256(1500)));
        uint256 tokenCreationFee = vm.envOr("TOKEN_CREATION_FEE", uint256(0.001 ether));

        vm.startBroadcast(deployerKey);

        // 1. TokenFactory
        TokenFactory tokenFactory = new TokenFactory(tokenCreationFee, feeRecipient);
        console.log("TokenFactory:", address(tokenFactory));

        // 2. LiquidityLockup implementation
        LiquidityLockup lockupImpl = new LiquidityLockup();
        console.log("LiquidityLockup (impl):", address(lockupImpl));

        // 3. LiquidityLockupFactory
        LiquidityLockupFactory lockupFactory = new LiquidityLockupFactory(address(lockupImpl));
        console.log("LiquidityLockupFactory:", address(lockupFactory));

        // 4. PostAuctionHandler
        PostAuctionHandler postAuctionHandler = new PostAuctionHandler(
            poolManager,
            positionManager,
            address(lockupFactory),
            address(0) // vault implementation — not used in V1 PoC (virtual deploys)
        );
        console.log("PostAuctionHandler:", address(postAuctionHandler));

        // 5. CCAAdapter
        CCAAdapter ccaAdapter = new CCAAdapter(ccaFactoryAddr);
        console.log("CCAAdapter:", address(ccaAdapter));

        // 6. OrchestratorDeployer
        OrchestratorDeployer deployer = new OrchestratorDeployer();
        console.log("OrchestratorDeployer:", address(deployer));

        // 7. LaunchFactory
        PlatformFeeConfig memory feeConfig = PlatformFeeConfig({
            feeRecipient: feeRecipient,
            saleFeeBps: saleFeeBps,
            lpFeeShareBps: lpFeeShareBps,
            tokenCreationFee: tokenCreationFee
        });

        LaunchFactory launchFactory = new LaunchFactory(
            platformAdmin,
            feeConfig,
            address(deployer),
            address(ccaAdapter),
            address(postAuctionHandler),
            address(tokenFactory)
        );
        console.log("LaunchFactory:", address(launchFactory));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("Chain ID:", block.chainid);
    }
}
