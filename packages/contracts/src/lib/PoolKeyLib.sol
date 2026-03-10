// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

/// @title PoolKeyLib
/// @notice Pure library for constructing Uniswap V4 PoolKey with correct token ordering
library PoolKeyLib {
    /// @notice Construct a PoolKey with tokens in canonical order (address-sorted)
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param fee Pool fee tier (e.g. 3000 = 0.30%)
    /// @param tickSpacing Tick spacing for the pool
    /// @return key The constructed PoolKey with currency0 < currency1
    function constructPoolKey(address tokenA, address tokenB, uint24 fee, int24 tickSpacing)
        internal
        pure
        returns (PoolKey memory key)
    {
        require(tokenA != tokenB, "PoolKeyLib: identical tokens");

        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);

        key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(address(0))
        });
    }

    /// @notice Get full-range tick bounds aligned to tick spacing
    /// @param tickSpacing The pool's tick spacing
    /// @return tickLower The minimum usable tick
    /// @return tickUpper The maximum usable tick
    function getFullRangeTicks(int24 tickSpacing) internal pure returns (int24 tickLower, int24 tickUpper) {
        tickLower = (TickMath.MIN_TICK / tickSpacing) * tickSpacing;
        tickUpper = (TickMath.MAX_TICK / tickSpacing) * tickSpacing;
    }
}
