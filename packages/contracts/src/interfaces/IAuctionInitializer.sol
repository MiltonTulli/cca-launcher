// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title IAuctionInitializer
/// @notice Adapter interface for CCA creation, decoupled from specific factory implementation
interface IAuctionInitializer {
    /// @notice Create and initialize a new auction
    /// @param token The token being auctioned
    /// @param amount The amount of tokens to auction
    /// @param configData ABI-encoded auction parameters
    /// @param salt Deterministic deployment salt
    /// @return cca The address of the deployed auction contract
    function createAuction(address token, uint256 amount, bytes calldata configData, bytes32 salt)
        external
        returns (address cca);
}
