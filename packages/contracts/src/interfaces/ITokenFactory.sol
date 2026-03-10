// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {TokenCreationParams} from "../types/LaunchTypes.sol";

/// @title ITokenFactory
/// @notice Creates ERC20 tokens for CREATE_NEW launches
interface ITokenFactory {
    event TokenDeployed(address indexed token, address indexed minter, string name, string symbol);

    /// @notice Create a new LaunchToken
    /// @param params Token configuration
    /// @param minter Address to receive MINTER_ROLE (typically the orchestrator)
    /// @return token Address of the deployed token
    function createToken(TokenCreationParams calldata params, address minter) external payable returns (address token);
}
