// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {LaunchParams, PlatformFeeConfig} from "../types/LaunchTypes.sol";

/// @title ILaunchFactory
/// @notice Creates and registers launches
interface ILaunchFactory {
    // ============================================
    // EVENTS
    // ============================================

    event LaunchCreated(
        uint256 indexed launchId, address indexed launch, address indexed operator, address token, address paymentToken
    );

    event PlatformFeeConfigUpdated(PlatformFeeConfig newConfig);
    event PlatformAdminTransferStarted(address indexed currentAdmin, address indexed pendingAdmin);
    event PlatformAdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    // ============================================
    // FUNCTIONS
    // ============================================

    /// @notice Create a new launch
    /// @param params Full launch configuration
    /// @return launchId Unique identifier for the launch
    /// @return launcherAddress Address of the deployed LaunchOrchestrator
    function createLaunch(LaunchParams calldata params) external returns (uint256 launchId, address launcherAddress);

    /// @notice Get orchestrator address by launch ID
    function getLaunch(uint256 launchId) external view returns (address);

    /// @notice Get all launch IDs created by an operator
    function getLaunchesByOperator(address operator) external view returns (uint256[] memory);

    /// @notice Total number of launches
    function launchCount() external view returns (uint256);

    /// @notice Current platform fee configuration
    function feeConfig() external view returns (PlatformFeeConfig memory);
}
