// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title PriceLib
/// @notice Pure library for converting CCA clearing prices to Uniswap V4 sqrtPriceX96
library PriceLib {
    uint256 internal constant Q192 = 2 ** 192;

    /// @notice Convert a price ratio to sqrtPriceX96
    /// @dev sqrtPriceX96 = sqrt(amount1 / amount0) * 2^96
    /// @param amount0 Amount of token0 (denominator of price)
    /// @param amount1 Amount of token1 (numerator of price)
    /// @return sqrtPriceX96 The sqrt price in Q64.96 format
    function computeSqrtPriceX96(uint256 amount0, uint256 amount1) internal pure returns (uint160) {
        require(amount0 > 0, "PriceLib: zero amount0");
        require(amount1 > 0, "PriceLib: zero amount1");

        // sqrtPriceX96 = sqrt(amount1 * 2^192 / amount0)
        uint256 ratioX192 = Math.mulDiv(amount1, Q192, amount0);
        return uint160(Math.sqrt(ratioX192));
    }

    /// @notice Convert CCA clearing price to sqrtPriceX96 for pool initialization
    /// @dev clearingPrice represents payment token units per auction token unit.
    ///      Token ordering determines whether this is price or inverse price.
    /// @param clearingPrice CCA clearing price (payment per auction token in raw units)
    /// @param auctionToken The auction token address
    /// @param paymentToken The payment token address
    /// @return sqrtPriceX96 The sqrt price for Uniswap V4 pool initialization
    function clearingPriceToSqrtPriceX96(uint256 clearingPrice, address auctionToken, address paymentToken)
        internal
        pure
        returns (uint160)
    {
        require(clearingPrice > 0, "PriceLib: zero clearing price");

        bool auctionIsToken0 = auctionToken < paymentToken;

        if (auctionIsToken0) {
            // token0 = auctionToken, token1 = paymentToken
            // price = paymentAmount / auctionAmount = clearingPrice
            // Use 1e18 as the base unit for the auction token
            return computeSqrtPriceX96(1e18, clearingPrice);
        } else {
            // token0 = paymentToken, token1 = auctionToken
            // price = auctionAmount / paymentAmount = 1/clearingPrice
            return computeSqrtPriceX96(clearingPrice, 1e18);
        }
    }
}
