// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Mock lockup factory for PostAuctionHandler testing
contract MockLockupFactory {
    struct CreateLockupCall {
        address vault;
        address beneficiary;
        uint64 unlockTimestamp;
    }

    CreateLockupCall[] public createLockupCalls;
    address public lastLockup;

    function createLockup(address vault, address beneficiary, uint64 unlockTimestamp)
        external
        returns (address lockup)
    {
        createLockupCalls.push(
            CreateLockupCall({vault: vault, beneficiary: beneficiary, unlockTimestamp: unlockTimestamp})
        );
        // Return a dummy address
        lockup = address(uint160(uint256(keccak256(abi.encode(vault, beneficiary, unlockTimestamp)))));
        lastLockup = lockup;
    }

    function getCallCount() external view returns (uint256) {
        return createLockupCalls.length;
    }
}
