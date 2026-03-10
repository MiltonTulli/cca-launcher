// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IAuctionInitializer} from "../../src/interfaces/IAuctionInitializer.sol";
import {MockCCA} from "./MockCCA.sol";

/// @notice Mock CCA factory that deploys MockCCA instances
contract MockCCAFactory is IAuctionInitializer {
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

        if (presetCCA != address(0)) {
            cca = presetCCA;
        } else {
            // Decode currency and fundsRecipient from configData
            (address currency,, address fundsRecipient,, uint64 endBlock_,,,,) =
                abi.decode(configData, (address, address, address, uint64, uint64, uint64, uint256, address, bytes));
            cca = address(new MockCCA(token, currency, fundsRecipient, endBlock_));
        }

        lastDeployedCCA = cca;
    }
}
