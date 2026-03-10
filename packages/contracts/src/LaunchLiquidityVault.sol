// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ILaunchLiquidityVault} from "./interfaces/ILaunchLiquidityVault.sol";
import {ILiquidityLockup} from "./interfaces/ILiquidityLockup.sol";

/// @title LaunchLiquidityVault
/// @notice Custodian of LP position NFT with fee collection and platform/creator split
/// @dev Holds a Uniswap V4 position NFT. Anyone can trigger fee collection (funds go to
///      configured beneficiaries). Position withdrawal is blocked while lockup is active.
contract LaunchLiquidityVault is ILaunchLiquidityVault, IERC721Receiver, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable positionManagerAddr;
    uint256 public override positionTokenId;

    address public platformBeneficiary;
    address public creatorBeneficiary;
    uint16 public platformFeeBps;

    address public token0;
    address public token1;

    address public lockupContract;
    address public owner;

    bool public positionWithdrawn;

    constructor(
        address positionManager_,
        uint256 positionTokenId_,
        address platformBeneficiary_,
        address creatorBeneficiary_,
        uint16 platformFeeBps_,
        address token0_,
        address token1_,
        address owner_
    ) {
        require(positionManager_ != address(0), "Vault: zero positionManager");
        require(platformBeneficiary_ != address(0), "Vault: zero platformBeneficiary");
        require(creatorBeneficiary_ != address(0), "Vault: zero creatorBeneficiary");
        require(platformFeeBps_ <= 10_000, "Vault: fee exceeds 100%");

        positionManagerAddr = positionManager_;
        positionTokenId = positionTokenId_;
        platformBeneficiary = platformBeneficiary_;
        creatorBeneficiary = creatorBeneficiary_;
        platformFeeBps = platformFeeBps_;
        token0 = token0_;
        token1 = token1_;
        owner = owner_;
    }

    // ============================================
    // LOCKUP CONFIGURATION
    // ============================================

    /// @notice Set the lockup contract address (only callable once by owner)
    function setLockupContract(address lockup_) external {
        require(msg.sender == owner, "Vault: only owner");
        require(lockupContract == address(0), "Vault: lockup already set");
        lockupContract = lockup_;
    }

    // ============================================
    // FEE COLLECTION (permissionless)
    // ============================================

    /// @inheritdoc ILaunchLiquidityVault
    function collectAndSplitFees() external override nonReentrant {
        (uint256 fee0, uint256 fee1) = _collectFees();

        emit FeesCollected(fee0, fee1);

        if (fee0 == 0 && fee1 == 0) return;

        uint256 platformFee0;
        uint256 platformFee1;
        uint256 creatorFee0;
        uint256 creatorFee1;

        if (fee0 > 0) {
            platformFee0 = (fee0 * platformFeeBps) / 10_000;
            creatorFee0 = fee0 - platformFee0;

            if (platformFee0 > 0) IERC20(token0).safeTransfer(platformBeneficiary, platformFee0);
            if (creatorFee0 > 0) IERC20(token0).safeTransfer(creatorBeneficiary, creatorFee0);
        }

        if (fee1 > 0) {
            platformFee1 = (fee1 * platformFeeBps) / 10_000;
            creatorFee1 = fee1 - platformFee1;

            if (platformFee1 > 0) IERC20(token1).safeTransfer(platformBeneficiary, platformFee1);
            if (creatorFee1 > 0) IERC20(token1).safeTransfer(creatorBeneficiary, creatorFee1);
        }

        emit FeesSplit(platformFee0, platformFee1, creatorFee0, creatorFee1);
    }

    // ============================================
    // POSITION WITHDRAWAL
    // ============================================

    /// @inheritdoc ILaunchLiquidityVault
    function withdrawPosition(address to) external override nonReentrant {
        require(msg.sender == owner, "Vault: only owner");
        require(!positionWithdrawn, "Vault: already withdrawn");
        require(isWithdrawable(), "Vault: position locked");
        require(to != address(0), "Vault: zero recipient");

        positionWithdrawn = true;

        // Transfer NFT to recipient
        bytes4 sig = bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
        (bool success,) = positionManagerAddr.call(abi.encodeWithSelector(sig, address(this), to, positionTokenId));
        require(success, "Vault: NFT transfer failed");

        emit PositionWithdrawn(to, positionTokenId);
    }

    /// @inheritdoc ILaunchLiquidityVault
    function isWithdrawable() public view override returns (bool) {
        if (positionWithdrawn) return false;
        if (lockupContract == address(0)) return true;
        return ILiquidityLockup(lockupContract).isUnlocked();
    }

    // ============================================
    // INTERNAL — Fee Collection (virtual for testing)
    // ============================================

    /// @dev Collect accumulated fees from V4 position. Override in tests.
    function _collectFees() internal virtual returns (uint256 fee0, uint256 fee1) {
        // In production, this calls positionManager with COLLECT action
        // For V1 PoC, this is virtual — overridden in tests.
        // Any tokens already in the vault (sent directly) are treated as fees.
        fee0 = IERC20(token0).balanceOf(address(this));
        fee1 = IERC20(token1).balanceOf(address(this));
    }

    // ============================================
    // ERC721 Receiver
    // ============================================

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
