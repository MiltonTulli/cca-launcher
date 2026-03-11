// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAuctionInitializer} from "./interfaces/IAuctionInitializer.sol";
import {IContinuousClearingAuctionFactory} from "@uniswap/cca/interfaces/IContinuousClearingAuctionFactory.sol";
import {IDistributionContract} from "@uniswap/cca/interfaces/external/IDistributionContract.sol";

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
    /// @dev The CCA factory deploys the auction but does NOT transfer tokens to it.
    ///      This adapter handles the full sequence: deploy → transfer → notify.
    function createAuction(address token, uint256 amount, bytes calldata configData, bytes32 salt)
        external
        override
        returns (address cca)
    {
        // Pull tokens from caller (LaunchOrchestrator)
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Deploy CCA via factory (factory does not move tokens)
        cca = address(ccaFactory.initializeDistribution(token, amount, configData, salt));

        // Transfer tokens to the deployed CCA
        IERC20(token).safeTransfer(cca, amount);

        // Notify CCA that tokens are available (required before bids can be processed)
        IDistributionContract(cca).onTokensReceived();
    }
}
