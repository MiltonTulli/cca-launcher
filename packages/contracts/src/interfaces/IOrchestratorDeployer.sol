// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {LaunchParams} from "../types/LaunchTypes.sol";

/// @title IOrchestratorDeployer
/// @notice Thin deployer interface for LaunchOrchestrator instances
interface IOrchestratorDeployer {
    /// @notice Deploy a new LaunchOrchestrator
    /// @param launchId Unique launch identifier
    /// @param params Launch configuration
    /// @param saleFeeBpsSnapshot Snapshotted sale fee from factory config
    /// @param auctionInitializer Address of the IAuctionInitializer
    /// @param postAuctionHandler Address of the IPostAuctionHandler
    /// @param tokenFactory Address of the ITokenFactory
    /// @param platformFeeRecipient Address to receive platform fees
    /// @param lpFeeShareBps Platform's share of LP fees (bps)
    /// @return orchestrator Address of the deployed orchestrator
    function deploy(
        uint256 launchId,
        LaunchParams calldata params,
        uint16 saleFeeBpsSnapshot,
        address auctionInitializer,
        address postAuctionHandler,
        address tokenFactory,
        address platformFeeRecipient,
        uint16 lpFeeShareBps
    ) external returns (address orchestrator);
}
