// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LaunchLiquidityVault} from "../../src/LaunchLiquidityVault.sol";

/// @notice Test-friendly vault that skips V4 fee collection and uses balance-based approach
contract TestableVault is LaunchLiquidityVault {
    constructor(
        address positionManager_,
        uint256 positionTokenId_,
        address platformBeneficiary_,
        address creatorBeneficiary_,
        uint16 platformFeeBps_,
        address token0_,
        address token1_,
        address owner_
    )
        LaunchLiquidityVault(
            positionManager_,
            positionTokenId_,
            platformBeneficiary_,
            creatorBeneficiary_,
            platformFeeBps_,
            token0_,
            token1_,
            owner_
        )
    {}

    /// @dev Override to use balance-based fee collection for unit tests
    function _collectFees() internal override returns (uint256 fee0, uint256 fee1) {
        fee0 = IERC20(token0).balanceOf(address(this));
        fee1 = IERC20(token1).balanceOf(address(this));
    }
}
