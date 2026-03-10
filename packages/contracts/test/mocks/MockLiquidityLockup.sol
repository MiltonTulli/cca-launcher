// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILiquidityLockup} from "../../src/interfaces/ILiquidityLockup.sol";

/// @notice Mock lockup for vault testing
contract MockLiquidityLockup is ILiquidityLockup {
    bool private _isUnlocked;
    address public override vault;
    address public override beneficiary;
    uint64 public override unlockTimestamp;

    function initialize(address vault_, address beneficiary_, uint64 unlockTimestamp_) external override {
        vault = vault_;
        beneficiary = beneficiary_;
        unlockTimestamp = unlockTimestamp_;
    }

    function isUnlocked() external view override returns (bool) {
        return _isUnlocked;
    }

    function unlock() external override {
        _isUnlocked = true;
    }

    // Test helper
    function setUnlocked(bool value) external {
        _isUnlocked = value;
    }
}
