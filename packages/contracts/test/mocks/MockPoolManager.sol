// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

/// @notice Minimal mock of Uniswap V4 PoolManager for testing
contract MockPoolManager {
    struct InitializeCall {
        bytes32 poolKeyHash;
        uint160 sqrtPriceX96;
    }

    InitializeCall[] public initializeCalls;
    bool public shouldRevert;

    function setRevert(bool revert_) external {
        shouldRevert = revert_;
    }

    function initialize(PoolKey memory key, uint160 sqrtPriceX96) external returns (int24 tick) {
        require(!shouldRevert, "MockPoolManager: revert");
        initializeCalls.push(InitializeCall({poolKeyHash: keccak256(abi.encode(key)), sqrtPriceX96: sqrtPriceX96}));
        return 0; // mock tick
    }

    function getInitializeCallCount() external view returns (uint256) {
        return initializeCalls.length;
    }

    function getLastSqrtPriceX96() external view returns (uint160) {
        require(initializeCalls.length > 0, "No calls");
        return initializeCalls[initializeCalls.length - 1].sqrtPriceX96;
    }
}
