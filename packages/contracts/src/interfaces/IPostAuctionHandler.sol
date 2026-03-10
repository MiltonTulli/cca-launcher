// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {VaultConfig} from "../types/LaunchTypes.sol";

/// @title IPostAuctionHandler
/// @notice Handles Uniswap V4 pool creation, LP minting, vault + lockup deployment
interface IPostAuctionHandler {
    event LiquidityCreated(
        uint256 indexed launchId,
        address indexed vault,
        address indexed pool,
        uint256 positionTokenId,
        uint256 liquidity
    );

    event LiquiditySkipped(uint256 indexed launchId, string reason);

    /// @notice Create Uniswap V4 pool, mint LP position, deploy vault (+ optional lockup)
    /// @param token The launch token
    /// @param paymentToken The payment currency
    /// @param tokenAmount Tokens allocated for LP
    /// @param paymentAmount Payment tokens allocated for LP
    /// @param poolFeeTier Uniswap pool fee tier
    /// @param tickSpacing Uniswap tick spacing
    /// @param clearingPrice CCA clearing price for pool initialization
    /// @param vaultConfig Fee split configuration
    /// @param lockupEnabled Whether to deploy a lockup contract
    /// @param lockupDuration Duration in seconds
    /// @param positionBeneficiary Recipient of the LP position after lockup
    /// @return vault Address of the deployed LaunchLiquidityVault
    /// @return positionTokenId The NFT token ID of the minted LP position
    function createLiquidityPosition(
        address token,
        address paymentToken,
        uint256 tokenAmount,
        uint256 paymentAmount,
        uint24 poolFeeTier,
        int24 tickSpacing,
        uint256 clearingPrice,
        VaultConfig calldata vaultConfig,
        bool lockupEnabled,
        uint64 lockupDuration,
        address positionBeneficiary
    ) external returns (address vault, uint256 positionTokenId);
}
