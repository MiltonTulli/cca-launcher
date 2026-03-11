// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAuctionInitializer} from "../../src/interfaces/IAuctionInitializer.sol";
import {AuctionParameters} from "@uniswap/cca/interfaces/IContinuousClearingAuction.sol";
import {MockCCA} from "./MockCCA.sol";

/// @notice Mock CCA factory that deploys MockCCA instances
/// @dev Mirrors real CCAAdapter behavior: pulls tokens from caller via transferFrom
///      and forwards them to the deployed CCA.
contract MockCCAFactory is IAuctionInitializer {
    using SafeERC20 for IERC20;

    address public lastDeployedCCA;
    address public lastToken;
    uint256 public lastAmount;
    bytes public lastConfigData;

    // Pre-configured mock CCA to return (if set)
    address public presetCCA;

    function setPresetCCA(address cca) external {
        presetCCA = cca;
    }

    function createAuction(
        address token,
        uint256 amount,
        bytes calldata configData,
        bytes32 /* salt */
    )
        external
        override
        returns (address cca)
    {
        lastToken = token;
        lastAmount = amount;
        lastConfigData = configData;

        // Pull tokens from caller (mirrors real CCAAdapter behavior)
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (presetCCA != address(0)) {
            cca = presetCCA;
        } else {
            // Decode using Uniswap's AuctionParameters struct (matches real CCA factory)
            AuctionParameters memory params = abi.decode(configData, (AuctionParameters));
            cca = address(new MockCCA(token, params.currency, params.tokensRecipient, params.fundsRecipient, params.endBlock));
        }

        // Forward tokens to the CCA and notify (mirrors real CCAAdapter behavior)
        IERC20(token).safeTransfer(cca, amount);
        MockCCA(payable(cca)).onTokensReceived();

        lastDeployedCCA = cca;
    }
}
