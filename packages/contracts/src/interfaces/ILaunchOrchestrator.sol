// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {LaunchState, TokenCreationParams} from "../types/LaunchTypes.sol";

/// @title ILaunchOrchestrator
/// @notice Per-launch lifecycle orchestrator
interface ILaunchOrchestrator {
    // ============================================
    // EVENTS
    // ============================================

    event TokenCreated(uint256 indexed launchId, address indexed token);
    event SetupFinalized(uint256 indexed launchId, address indexed cca, uint256 tokenAmount, uint64 endBlock);
    event LaunchCancelled(uint256 indexed launchId);
    event AuctionSettled(uint256 indexed launchId, uint256 totalRaised, uint256 tokensSold);
    event AuctionFailed(uint256 indexed launchId, string reason);
    event DistributionComplete(
        uint256 indexed launchId, uint256 saleFee, uint256 liquidityAmount, uint256 treasuryAmount
    );
    event OperatorTransferStarted(address indexed currentOperator, address indexed pendingOperator);
    event OperatorTransferred(address indexed previousOperator, address indexed newOperator);
    event TokenSwept(address indexed token, uint256 amount);
    event PaymentTokenSwept(address indexed token, uint256 amount);
    event EmergencyRescue(address indexed tokenAddress, address indexed to, uint256 amount);

    // ============================================
    // TOKEN CREATION (CREATE_NEW only)
    // ============================================

    /// @notice Create the launch token via TokenFactory (only for CREATE_NEW source)
    /// @dev Only callable by operator while state == SETUP
    function createToken(TokenCreationParams calldata params) external payable;

    // ============================================
    // LIFECYCLE
    // ============================================

    /// @notice Finalize setup: validate token source, deploy CCA, provision tokens
    /// @dev SETUP → FINALIZED
    function finalizeSetup() external;

    /// @notice Cancel the launch before it goes live
    /// @dev SETUP → CANCELLED
    function cancel() external;

    /// @notice Settle the auction after it ends
    /// @dev FINALIZED → AUCTION_ENDED or AUCTION_FAILED
    function settleAuction() external;

    /// @notice Execute post-auction distribution (fees, LP, treasury)
    /// @dev AUCTION_ENDED → DISTRIBUTED
    function processDistribution() external;

    // ============================================
    // OPERATOR MANAGEMENT
    // ============================================

    /// @notice Propose a new operator (two-step transfer)
    function transferOperator(address newOperator) external;

    /// @notice Accept the operator role
    function acceptOperator() external;

    // ============================================
    // SWEEP (post-distribution cleanup)
    // ============================================

    /// @notice Sweep residual launch tokens to treasury
    function sweepToken() external;

    /// @notice Sweep residual payment tokens to treasury
    function sweepPaymentToken() external;

    /// @notice Emergency rescue any token or ETH stuck in the orchestrator
    /// @dev Immediate in terminal states; requires safety delay in non-terminal states
    /// @param tokenAddress ERC20 address to rescue, or address(0) for native ETH
    function emergencyRescue(address tokenAddress) external;

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    function getState() external view returns (LaunchState);
    function isDistributionPermissionless() external view returns (bool);
}
