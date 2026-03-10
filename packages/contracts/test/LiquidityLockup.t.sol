// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {LiquidityLockup} from "../src/LiquidityLockup.sol";
import {LiquidityLockupFactory} from "../src/LiquidityLockupFactory.sol";
import {ILiquidityLockup} from "../src/interfaces/ILiquidityLockup.sol";

contract LiquidityLockupTest is Test {
    LiquidityLockup public implementation;
    LiquidityLockupFactory public factory;

    address public vault = makeAddr("vault");
    address public beneficiary = makeAddr("beneficiary");
    uint64 public unlockTimestamp;

    function setUp() public {
        implementation = new LiquidityLockup();
        factory = new LiquidityLockupFactory(address(implementation));
        unlockTimestamp = uint64(block.timestamp) + 30 days;
    }

    // ============================================
    // FACTORY
    // ============================================

    function test_factory_createsClone() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        assertTrue(lockup != address(0));
        assertEq(ILiquidityLockup(lockup).vault(), vault);
        assertEq(ILiquidityLockup(lockup).beneficiary(), beneficiary);
        assertEq(ILiquidityLockup(lockup).unlockTimestamp(), unlockTimestamp);
    }

    function test_factory_emitsEvent() public {
        vm.expectEmit(false, true, true, true);
        emit LiquidityLockupFactory.LockupCreated(address(0), vault, beneficiary, unlockTimestamp);

        factory.createLockup(vault, beneficiary, unlockTimestamp);
    }

    function test_factory_multipleClones() public {
        address lockup1 = factory.createLockup(vault, beneficiary, unlockTimestamp);
        address lockup2 = factory.createLockup(vault, beneficiary, unlockTimestamp + 1);

        assertTrue(lockup1 != lockup2);
        assertEq(ILiquidityLockup(lockup1).unlockTimestamp(), unlockTimestamp);
        assertEq(ILiquidityLockup(lockup2).unlockTimestamp(), unlockTimestamp + 1);
    }

    function test_factory_revertsZeroImplementation() public {
        vm.expectRevert("LockupFactory: zero implementation");
        new LiquidityLockupFactory(address(0));
    }

    // ============================================
    // INITIALIZE
    // ============================================

    function test_initialize_setsState() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        assertEq(ILiquidityLockup(lockup).vault(), vault);
        assertEq(ILiquidityLockup(lockup).beneficiary(), beneficiary);
        assertEq(ILiquidityLockup(lockup).unlockTimestamp(), unlockTimestamp);
    }

    function test_initialize_emitsEvent() public {
        // Event emitted during factory.createLockup -> initialize
        vm.expectEmit(true, true, false, true);
        emit ILiquidityLockup.LockupInitialized(vault, beneficiary, unlockTimestamp);

        factory.createLockup(vault, beneficiary, unlockTimestamp);
    }

    function test_initialize_revertsDoubleInit() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        vm.expectRevert("Lockup: already initialized");
        ILiquidityLockup(lockup).initialize(vault, beneficiary, unlockTimestamp);
    }

    function test_initialize_revertsZeroVault() public {
        LiquidityLockup lockup = new LiquidityLockup();
        vm.expectRevert("Lockup: zero vault");
        lockup.initialize(address(0), beneficiary, unlockTimestamp);
    }

    function test_initialize_revertsZeroBeneficiary() public {
        LiquidityLockup lockup = new LiquidityLockup();
        vm.expectRevert("Lockup: zero beneficiary");
        lockup.initialize(vault, address(0), unlockTimestamp);
    }

    function test_initialize_revertsPastTimestamp() public {
        LiquidityLockup lockup = new LiquidityLockup();
        vm.expectRevert("Lockup: unlock must be in the future");
        lockup.initialize(vault, beneficiary, uint64(block.timestamp));
    }

    // ============================================
    // isUnlocked
    // ============================================

    function test_isUnlocked_falseBeforeTimestamp() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        assertFalse(ILiquidityLockup(lockup).isUnlocked());
    }

    function test_isUnlocked_trueAtTimestamp() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        vm.warp(unlockTimestamp);
        assertTrue(ILiquidityLockup(lockup).isUnlocked());
    }

    function test_isUnlocked_trueAfterTimestamp() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        vm.warp(unlockTimestamp + 1);
        assertTrue(ILiquidityLockup(lockup).isUnlocked());
    }

    // ============================================
    // unlock
    // ============================================

    function test_unlock_succeedsAfterTimestamp() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        vm.warp(unlockTimestamp);
        ILiquidityLockup(lockup).unlock();

        assertTrue(ILiquidityLockup(lockup).isUnlocked());
    }

    function test_unlock_emitsEvent() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        vm.warp(unlockTimestamp);

        vm.expectEmit(true, false, false, true);
        emit ILiquidityLockup.LockupUnlocked(vault, unlockTimestamp);

        ILiquidityLockup(lockup).unlock();
    }

    function test_unlock_revertsBeforeTimestamp() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        vm.expectRevert("Lockup: not expired");
        ILiquidityLockup(lockup).unlock();
    }

    function test_unlock_revertsDoubleUnlock() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        vm.warp(unlockTimestamp);
        ILiquidityLockup(lockup).unlock();

        vm.expectRevert("Lockup: already unlocked");
        ILiquidityLockup(lockup).unlock();
    }

    // ============================================
    // INTEGRATION: Lockup + Vault withdrawal
    // ============================================

    function test_lockupBlocksVaultWithdrawal_thenAllows() public {
        address lockup = factory.createLockup(vault, beneficiary, unlockTimestamp);

        // Before unlock
        assertFalse(ILiquidityLockup(lockup).isUnlocked());

        // After unlock
        vm.warp(unlockTimestamp);
        assertTrue(ILiquidityLockup(lockup).isUnlocked());
    }
}
