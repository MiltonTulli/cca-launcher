// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILiquidityLockup} from "./interfaces/ILiquidityLockup.sol";

/// @title LiquidityLockup
/// @notice Blocks LP position withdrawal until unlockTimestamp
/// @dev Deployed as clones via LiquidityLockupFactory. Initialize once after clone.
contract LiquidityLockup is ILiquidityLockup {
    address public override vault;
    address public override beneficiary;
    uint64 public override unlockTimestamp;
    bool private _initialized;
    bool private _unlocked;

    /// @inheritdoc ILiquidityLockup
    function initialize(address vault_, address beneficiary_, uint64 unlockTimestamp_) external override {
        require(!_initialized, "Lockup: already initialized");
        require(vault_ != address(0), "Lockup: zero vault");
        require(beneficiary_ != address(0), "Lockup: zero beneficiary");
        require(unlockTimestamp_ > block.timestamp, "Lockup: unlock in the past");

        vault = vault_;
        beneficiary = beneficiary_;
        unlockTimestamp = unlockTimestamp_;
        _initialized = true;

        emit LockupInitialized(vault_, beneficiary_, unlockTimestamp_);
    }

    /// @inheritdoc ILiquidityLockup
    function isUnlocked() external view override returns (bool) {
        return _unlocked || block.timestamp >= unlockTimestamp;
    }

    /// @inheritdoc ILiquidityLockup
    function unlock() external override {
        require(block.timestamp >= unlockTimestamp, "Lockup: not expired");
        require(!_unlocked, "Lockup: already unlocked");

        _unlocked = true;
        emit LockupUnlocked(vault, unlockTimestamp);
    }
}
