// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title ILiquidityLockup
/// @notice Blocks LP position withdrawal until unlockTimestamp
interface ILiquidityLockup {
    event LockupInitialized(address indexed vault, address indexed beneficiary, uint64 unlockTimestamp);
    event LockupUnlocked(address indexed vault, uint64 unlockTimestamp);

    /// @notice Initialize the lockup (called once after clone deployment)
    function initialize(address vault_, address beneficiary_, uint64 unlockTimestamp_) external;

    /// @notice Whether the lockup period has passed
    function isUnlocked() external view returns (bool);

    /// @notice Mark as unlocked (callable after unlockTimestamp)
    function unlock() external;

    /// @notice The vault this lockup protects
    function vault() external view returns (address);

    /// @notice The beneficiary who receives the position after unlock
    function beneficiary() external view returns (address);

    /// @notice Timestamp when the lockup expires
    function unlockTimestamp() external view returns (uint64);
}
