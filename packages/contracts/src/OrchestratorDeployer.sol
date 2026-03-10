// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IOrchestratorDeployer} from "./interfaces/IOrchestratorDeployer.sol";
import {LaunchParams} from "./types/LaunchTypes.sol";
import {LaunchOrchestrator} from "./LaunchOrchestrator.sol";

/// @title OrchestratorDeployer
/// @notice Thin deployer that creates new LaunchOrchestrator instances.
///         Separated from factory to allow upgrading the orchestrator template.
contract OrchestratorDeployer is IOrchestratorDeployer {
    /// @inheritdoc IOrchestratorDeployer
    function deploy(
        uint256 launchId,
        LaunchParams calldata params,
        uint16 saleFeeBpsSnapshot,
        address auctionInitializer,
        address postAuctionHandler,
        address tokenFactory,
        address platformFeeRecipient,
        uint16 lpFeeShareBps
    ) external override returns (address orchestrator) {
        orchestrator = address(
            new LaunchOrchestrator(
                launchId,
                msg.sender, // factory
                params,
                saleFeeBpsSnapshot,
                auctionInitializer,
                postAuctionHandler,
                tokenFactory,
                platformFeeRecipient,
                lpFeeShareBps
            )
        );
    }
}
