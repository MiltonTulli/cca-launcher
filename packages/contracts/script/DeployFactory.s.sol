// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

import {LaunchFactory} from "../src/LaunchFactory.sol";
import {OrchestratorDeployer} from "../src/OrchestratorDeployer.sol";
import {PlatformFeeConfig} from "../src/types/LaunchTypes.sol";

/// @title DeployFactory
/// @notice Standalone deployment of LaunchFactory + OrchestratorDeployer
/// @dev Use when other infrastructure (TokenFactory, CCAAdapter, etc.) is already deployed.
///
/// Usage:
///   forge script script/DeployFactory.s.sol:DeployFactory \
///     --rpc-url sepolia \
///     --broadcast \
///     --verify \
///     -vvvv
///
/// Required env vars:
///   DEPLOYER_PRIVATE_KEY     — private key of the deployer
///   PLATFORM_ADMIN           — address of the platform admin
///   PLATFORM_FEE_RECIPIENT   — address to receive platform fees
///   CCA_ADAPTER              — deployed CCAAdapter address
///   POST_AUCTION_HANDLER     — deployed PostAuctionHandler address
///   TOKEN_FACTORY            — deployed TokenFactory address
///
/// Optional env vars:
///   SALE_FEE_BPS             — sale fee in bps (default: 500 = 5%)
///   LP_FEE_SHARE_BPS         — LP fee share in bps (default: 1500 = 15%)
///   TOKEN_CREATION_FEE       — fee in wei (default: 0.001 ether)
contract DeployFactory is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address platformAdmin = vm.envAddress("PLATFORM_ADMIN");
        address feeRecipient = vm.envAddress("PLATFORM_FEE_RECIPIENT");
        address ccaAdapter = vm.envAddress("CCA_ADAPTER");
        address postAuctionHandler = vm.envAddress("POST_AUCTION_HANDLER");
        address tokenFactory = vm.envAddress("TOKEN_FACTORY");

        uint16 saleFeeBps = uint16(vm.envOr("SALE_FEE_BPS", uint256(500)));
        uint16 lpFeeShareBps = uint16(vm.envOr("LP_FEE_SHARE_BPS", uint256(1500)));
        uint256 tokenCreationFee = vm.envOr("TOKEN_CREATION_FEE", uint256(0.001 ether));

        vm.startBroadcast(deployerKey);

        OrchestratorDeployer deployer = new OrchestratorDeployer();
        console.log("OrchestratorDeployer:", address(deployer));

        PlatformFeeConfig memory feeConfig = PlatformFeeConfig({
            feeRecipient: feeRecipient,
            saleFeeBps: saleFeeBps,
            lpFeeShareBps: lpFeeShareBps,
            tokenCreationFee: tokenCreationFee
        });

        LaunchFactory launchFactory = new LaunchFactory(
            platformAdmin, feeConfig, address(deployer), ccaAdapter, postAuctionHandler, tokenFactory
        );
        console.log("LaunchFactory:", address(launchFactory));

        vm.stopBroadcast();
    }
}
