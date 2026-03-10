// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {TestBase} from "./helpers/TestBase.sol";
import {LaunchLiquidityVault} from "../src/LaunchLiquidityVault.sol";
import {ILaunchLiquidityVault} from "../src/interfaces/ILaunchLiquidityVault.sol";
import {MockLiquidityLockup} from "./mocks/MockLiquidityLockup.sol";

contract LiquidityVaultTest is TestBase {
    LaunchLiquidityVault public vault;
    uint256 public tokenId;

    function setUp() public override {
        super.setUp();

        // Mint a position NFT
        tokenId = positionManager.mintPosition(address(this));

        vault = new LaunchLiquidityVault(
            address(positionManager),
            tokenId,
            platformFeeRecipient,
            treasury,
            LP_FEE_SHARE_BPS, // 1500 = 15%
            address(auctionToken),
            address(paymentToken),
            address(this) // owner = test contract
        );

        // Transfer NFT to vault
        positionManager.safeTransferFrom(address(this), address(vault), tokenId);

        vm.label(address(vault), "LiquidityVault");
    }

    // ============================================
    // FEE COLLECTION — HAPPY PATH
    // ============================================

    function test_collectAndSplitFees_splitsCorrectly() public {
        uint256 fee0Amount = 10_000e18;
        uint256 fee1Amount = 5_000e6;

        // Simulate fees arriving in vault
        auctionToken.mint(address(vault), fee0Amount);
        paymentToken.mint(address(vault), fee1Amount);

        vault.collectAndSplitFees();

        // 15% to platform, 85% to creator
        uint256 expectedPlatform0 = (fee0Amount * LP_FEE_SHARE_BPS) / 10_000;
        uint256 expectedCreator0 = fee0Amount - expectedPlatform0;
        uint256 expectedPlatform1 = (fee1Amount * LP_FEE_SHARE_BPS) / 10_000;
        uint256 expectedCreator1 = fee1Amount - expectedPlatform1;

        assertEq(auctionToken.balanceOf(platformFeeRecipient), expectedPlatform0);
        assertEq(auctionToken.balanceOf(treasury), expectedCreator0);
        assertEq(paymentToken.balanceOf(platformFeeRecipient), expectedPlatform1);
        assertEq(paymentToken.balanceOf(treasury), expectedCreator1);
    }

    function test_collectAndSplitFees_emitsEvents() public {
        uint256 fee0Amount = 1000e18;
        uint256 fee1Amount = 500e6;

        auctionToken.mint(address(vault), fee0Amount);
        paymentToken.mint(address(vault), fee1Amount);

        uint256 expectedPlatform0 = (fee0Amount * LP_FEE_SHARE_BPS) / 10_000;
        uint256 expectedCreator0 = fee0Amount - expectedPlatform0;
        uint256 expectedPlatform1 = (fee1Amount * LP_FEE_SHARE_BPS) / 10_000;
        uint256 expectedCreator1 = fee1Amount - expectedPlatform1;

        vm.expectEmit(false, false, false, true);
        emit ILaunchLiquidityVault.FeesCollected(fee0Amount, fee1Amount);

        vm.expectEmit(false, false, false, true);
        emit ILaunchLiquidityVault.FeesSplit(expectedPlatform0, expectedPlatform1, expectedCreator0, expectedCreator1);

        vault.collectAndSplitFees();
    }

    function test_collectAndSplitFees_noFees() public {
        // Should not revert with zero fees
        vault.collectAndSplitFees();

        assertEq(auctionToken.balanceOf(platformFeeRecipient), 0);
        assertEq(auctionToken.balanceOf(treasury), 0);
    }

    function test_collectAndSplitFees_onlyToken0() public {
        auctionToken.mint(address(vault), 1000e18);

        vault.collectAndSplitFees();

        uint256 expectedPlatform = (1000e18 * uint256(LP_FEE_SHARE_BPS)) / 10_000;
        assertEq(auctionToken.balanceOf(platformFeeRecipient), expectedPlatform);
        assertEq(paymentToken.balanceOf(platformFeeRecipient), 0);
    }

    function test_collectAndSplitFees_permissionless() public {
        auctionToken.mint(address(vault), 1000e18);

        // Anyone can call
        vm.prank(user1);
        vault.collectAndSplitFees();

        // Funds go to configured beneficiaries, not caller
        assertEq(auctionToken.balanceOf(user1), 0);
        assertTrue(auctionToken.balanceOf(platformFeeRecipient) > 0);
        assertTrue(auctionToken.balanceOf(treasury) > 0);
    }

    function test_collectAndSplitFees_multipleCalls() public {
        // First batch
        auctionToken.mint(address(vault), 1000e18);
        vault.collectAndSplitFees();

        uint256 platformAfterFirst = auctionToken.balanceOf(platformFeeRecipient);

        // Second batch
        auctionToken.mint(address(vault), 2000e18);
        vault.collectAndSplitFees();

        uint256 expectedSecondPlatform = (2000e18 * uint256(LP_FEE_SHARE_BPS)) / 10_000;
        assertEq(auctionToken.balanceOf(platformFeeRecipient) - platformAfterFirst, expectedSecondPlatform);
    }

    // ============================================
    // POSITION WITHDRAWAL — NO LOCKUP
    // ============================================

    function test_withdrawPosition_noLockup() public {
        assertTrue(vault.isWithdrawable());

        vault.withdrawPosition(user1);

        assertEq(positionManager.ownerOf(tokenId), user1);
        assertTrue(vault.positionWithdrawn());
    }

    function test_withdrawPosition_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit ILaunchLiquidityVault.PositionWithdrawn(user1, tokenId);

        vault.withdrawPosition(user1);
    }

    function test_withdrawPosition_revertsNonOwner() public {
        vm.prank(user1);
        vm.expectRevert("Vault: only owner");
        vault.withdrawPosition(user1);
    }

    function test_withdrawPosition_revertsDoubleWithdraw() public {
        vault.withdrawPosition(user1);

        vm.expectRevert("Vault: already withdrawn");
        vault.withdrawPosition(user2);
    }

    function test_withdrawPosition_revertsZeroRecipient() public {
        vm.expectRevert("Vault: zero recipient");
        vault.withdrawPosition(address(0));
    }

    // ============================================
    // POSITION WITHDRAWAL — WITH LOCKUP
    // ============================================

    function test_withdrawPosition_blockedByLockup() public {
        MockLiquidityLockup lockup = new MockLiquidityLockup();
        lockup.setUnlocked(false);
        vault.setLockupContract(address(lockup));

        assertFalse(vault.isWithdrawable());

        vm.expectRevert("Vault: position locked");
        vault.withdrawPosition(user1);
    }

    function test_withdrawPosition_allowedAfterLockupExpires() public {
        MockLiquidityLockup lockup = new MockLiquidityLockup();
        lockup.setUnlocked(false);
        vault.setLockupContract(address(lockup));

        // Simulate lockup expiry
        lockup.setUnlocked(true);
        assertTrue(vault.isWithdrawable());

        vault.withdrawPosition(user1);
        assertEq(positionManager.ownerOf(tokenId), user1);
    }

    function test_collectFees_worksWhileLocked() public {
        MockLiquidityLockup lockup = new MockLiquidityLockup();
        lockup.setUnlocked(false);
        vault.setLockupContract(address(lockup));

        // Fees can be collected even during lockup
        auctionToken.mint(address(vault), 1000e18);
        vault.collectAndSplitFees();

        assertTrue(auctionToken.balanceOf(platformFeeRecipient) > 0);
        assertTrue(auctionToken.balanceOf(treasury) > 0);
    }

    // ============================================
    // LOCKUP CONFIGURATION
    // ============================================

    function test_setLockupContract_onlyOwner() public {
        vm.prank(user1);
        vm.expectRevert("Vault: only owner");
        vault.setLockupContract(address(1));
    }

    function test_setLockupContract_onlyOnce() public {
        vault.setLockupContract(address(1));

        vm.expectRevert("Vault: lockup already set");
        vault.setLockupContract(address(2));
    }

    // ============================================
    // NFT RECEIPT
    // ============================================

    function test_onERC721Received() public {
        uint256 newTokenId = positionManager.mintPosition(address(this));
        positionManager.safeTransferFrom(address(this), address(vault), newTokenId);
        assertEq(positionManager.ownerOf(newTokenId), address(vault));
    }

    // ============================================
    // isWithdrawable
    // ============================================

    function test_isWithdrawable_trueByDefault() public view {
        assertTrue(vault.isWithdrawable());
    }

    function test_isWithdrawable_falseAfterWithdraw() public {
        vault.withdrawPosition(user1);
        assertFalse(vault.isWithdrawable());
    }

    // ============================================
    // ERC721 RECEIVER (needed for setUp)
    // ============================================

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
