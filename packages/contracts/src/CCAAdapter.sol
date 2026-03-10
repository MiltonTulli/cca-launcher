// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAuctionInitializer} from "./interfaces/IAuctionInitializer.sol";

/// @title IContinuousClearingAuctionFactory
/// @notice Interface for the real Uniswap CCA factory
interface IContinuousClearingAuctionFactory {
    function initializeDistribution(address token, uint256 amount, bytes calldata configData, bytes32 salt)
        external
        returns (address cca);
}

/// @title CCAAdapter
/// @notice Wraps IContinuousClearingAuctionFactory behind IAuctionInitializer
/// @dev Decouples the LaunchOrchestrator from the specific CCA factory implementation.
///      If the factory interface changes, only this adapter needs updating.
contract CCAAdapter is IAuctionInitializer {
    using SafeERC20 for IERC20;

    IContinuousClearingAuctionFactory public immutable ccaFactory;

    constructor(address ccaFactory_) {
        require(ccaFactory_ != address(0), "CCAAdapter: zero factory");
        ccaFactory = IContinuousClearingAuctionFactory(ccaFactory_);
    }

    /// @inheritdoc IAuctionInitializer
    /// @dev Approves token spending to the CCA factory, then delegates to initializeDistribution.
    ///      configData is passed through as-is — the CCA factory decodes it internally.
    function createAuction(address token, uint256 amount, bytes calldata configData, bytes32 salt)
        external
        override
        returns (address cca)
    {
        // Pull tokens from caller (LaunchOrchestrator)
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Approve CCA factory to spend tokens
        IERC20(token).forceApprove(address(ccaFactory), amount);

        // Delegate to real factory
        cca = ccaFactory.initializeDistribution(token, amount, configData, salt);
    }
}
