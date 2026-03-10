// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ILiquidityLockup} from "./interfaces/ILiquidityLockup.sol";

/// @title LiquidityLockupFactory
/// @notice Deploys LiquidityLockup clones
contract LiquidityLockupFactory {
    address public immutable implementation;

    event LockupCreated(
        address indexed lockup, address indexed vault, address indexed beneficiary, uint64 unlockTimestamp
    );

    constructor(address implementation_) {
        require(implementation_ != address(0), "LockupFactory: zero implementation");
        implementation = implementation_;
    }

    /// @notice Deploy a new lockup clone
    function createLockup(address vault, address beneficiary, uint64 unlockTimestamp)
        external
        returns (address lockup)
    {
        lockup = Clones.clone(implementation);
        ILiquidityLockup(lockup).initialize(vault, beneficiary, unlockTimestamp);
        emit LockupCreated(lockup, vault, beneficiary, unlockTimestamp);
    }
}
