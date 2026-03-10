// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @notice Minimal mock vault for PostAuctionHandler testing
contract MockLaunchLiquidityVault is IERC721Receiver {
    address public positionManager;
    uint256 public positionTokenId;
    address public platformBeneficiary;
    address public creatorBeneficiary;
    uint16 public platformFeeBps;
    address public token0;
    address public token1;
    address public lockupContract;

    constructor(
        address positionManager_,
        uint256 positionTokenId_,
        address platformBeneficiary_,
        address creatorBeneficiary_,
        uint16 platformFeeBps_,
        address token0_,
        address token1_
    ) {
        positionManager = positionManager_;
        positionTokenId = positionTokenId_;
        platformBeneficiary = platformBeneficiary_;
        creatorBeneficiary = creatorBeneficiary_;
        platformFeeBps = platformFeeBps_;
        token0 = token0_;
        token1 = token1_;
    }

    function setLockupContract(address lockup_) external {
        lockupContract = lockup_;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
