// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PostAuctionHandler} from "../../src/PostAuctionHandler.sol";
import {VaultConfig} from "../../src/types/LaunchTypes.sol";
import {MockPositionManager} from "./MockPositionManager.sol";
import {MockLaunchLiquidityVault} from "./MockLaunchLiquidityVault.sol";

/// @notice Test-friendly PostAuctionHandler that overrides V4 interaction
contract TestablePostAuctionHandler is PostAuctionHandler {
    uint256 public lastPositionTokenId;
    address public lastVaultDeployed;

    constructor(address poolManager_, address positionManager_, address lockupFactory_, address vaultImplementation_)
        PostAuctionHandler(poolManager_, positionManager_, lockupFactory_, vaultImplementation_)
    {}

    function _mintLPPosition(
        PoolKey memory, /* poolKey */
        int24, /* tickLower */
        int24, /* tickUpper */
        uint256, /* tokenAmount */
        uint256 /* paymentAmount */
    )
        internal
        override
        returns (uint256 positionTokenId)
    {
        positionTokenId = MockPositionManager(positionManager).mintPosition(address(this));
        lastPositionTokenId = positionTokenId;
    }

    function _deployVault(
        uint256 positionTokenId_,
        VaultConfig calldata vaultConfig,
        address token,
        address paymentToken
    ) internal override returns (address vault) {
        vault = address(
            new MockLaunchLiquidityVault(
                positionManager,
                positionTokenId_,
                vaultConfig.platformBeneficiary,
                vaultConfig.creatorBeneficiary,
                vaultConfig.platformFeeBps,
                token,
                paymentToken
            )
        );
        lastVaultDeployed = vault;
    }
}
