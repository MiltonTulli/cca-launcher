// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {LaunchState} from "../types/LaunchTypes.sol";

// ============================================
// LIFECYCLE ERRORS
// ============================================

/// @notice Wrong lifecycle state for the requested action
error InvalidState(LaunchState current, LaunchState required);

/// @notice Caller is not the operator
error OnlyOperator(address caller, address operator);

/// @notice Token approval too low for EXISTING_TRANSFER_FROM
error InsufficientAllowance(uint256 required, uint256 actual);

/// @notice Not enough tokens in contract for EXISTING_BALANCE
error InsufficientTokenBalance(uint256 required, uint256 actual);

/// @notice Orchestrator missing MINTER_ROLE on token (for CREATE_NEW)
error MissingMinterRole(address token, address account);

/// @notice Zero tokens allocated for auction
error AuctionSupplyMustBePositive();

/// @notice Auction has not ended yet
error AuctionNotEnded(uint256 currentBlock, uint256 endBlock);

/// @notice Non-operator tried to distribute before permissionless delay
error DistributionNotPermissionless(uint256 currentBlock, uint256 permissionlessBlock);

/// @notice Tried to distribute but auction had zero bids
error AuctionHasNoBids();

/// @notice Tried to finalize as failed but auction actually had bids
error AuctionNotFailed();

/// @notice Lockup period has not expired yet
error LockupNotExpired(uint256 currentTime, uint256 unlockTime);

/// @notice Invalid address parameter
error InvalidAddress(string param);

/// @notice Zero address provided
error ZeroAddress();

/// @notice Caller is not the platform admin
error NotPlatformAdmin();

/// @notice Caller is not the pending platform admin
error NotPendingPlatformAdmin();

/// @notice Token has not been created yet (CREATE_NEW flow)
error TokenNotCreated();

/// @notice Token was already created
error TokenAlreadyCreated();

/// @notice Invalid token source for this action
error InvalidTokenSource();

/// @notice Already initialized (for clone pattern)
error AlreadyInitialized();
