// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

import {IPostAuctionHandler} from "./interfaces/IPostAuctionHandler.sol";
import {VaultConfig} from "./types/LaunchTypes.sol";
import {PriceLib} from "./lib/PriceLib.sol";
import {PoolKeyLib} from "./lib/PoolKeyLib.sol";

/// @title PostAuctionHandler
/// @notice Creates Uniswap V4 pool + LP position, deploys vault + lockup
/// @dev Receives token approvals from LaunchOrchestrator, creates LP, deploys vault
contract PostAuctionHandler is IPostAuctionHandler, IERC721Receiver {
    using SafeERC20 for IERC20;

    IPoolManager public immutable poolManager;
    address public immutable positionManager;
    address public immutable lockupFactory;
    address public immutable vaultImplementation;

    constructor(address poolManager_, address positionManager_, address lockupFactory_, address vaultImplementation_) {
        poolManager = IPoolManager(poolManager_);
        positionManager = positionManager_;
        lockupFactory = lockupFactory_;
        vaultImplementation = vaultImplementation_;
    }

    /// @inheritdoc IPostAuctionHandler
    function createLiquidityPosition(
        address token,
        address paymentToken,
        uint256 tokenAmount,
        uint256 paymentAmount,
        uint24 poolFeeTier,
        int24 tickSpacing,
        uint256 clearingPrice,
        VaultConfig calldata vaultConfig,
        bool lockupEnabled,
        uint64 lockupDuration,
        address positionBeneficiary
    ) external override returns (address vault, uint256 positionTokenId) {
        // Pull tokens from caller
        _pullTokens(token, paymentToken, tokenAmount, paymentAmount);

        // Initialize pool + mint position
        positionTokenId = _initializeAndMint(
            token, paymentToken, tokenAmount, paymentAmount, poolFeeTier, tickSpacing, clearingPrice
        );

        // Deploy vault + transfer NFT
        vault = _deployAndTransfer(positionTokenId, vaultConfig, token, paymentToken);

        // Handle lockup if enabled
        if (lockupEnabled && lockupFactory != address(0)) {
            _deployLockup(vault, positionBeneficiary, lockupDuration);
        }

        // Return any unused tokens to caller
        _returnUnusedTokens(token, paymentToken, msg.sender);
    }

    // ============================================
    // INTERNAL — Token Handling
    // ============================================

    function _pullTokens(address token, address paymentToken, uint256 tokenAmount, uint256 paymentAmount) internal {
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), paymentAmount);
    }

    function _returnUnusedTokens(address token, address paymentToken, address recipient) internal {
        uint256 tokenBalance = IERC20(token).balanceOf(address(this));
        if (tokenBalance > 0) {
            IERC20(token).safeTransfer(recipient, tokenBalance);
        }

        uint256 paymentBalance = IERC20(paymentToken).balanceOf(address(this));
        if (paymentBalance > 0) {
            IERC20(paymentToken).safeTransfer(recipient, paymentBalance);
        }
    }

    // ============================================
    // INTERNAL — Pool + Position
    // ============================================

    function _initializeAndMint(
        address token,
        address paymentToken,
        uint256 tokenAmount,
        uint256 paymentAmount,
        uint24 poolFeeTier,
        int24 tickSpacing,
        uint256 clearingPrice
    ) internal returns (uint256 positionTokenId) {
        PoolKey memory poolKey = PoolKeyLib.constructPoolKey(token, paymentToken, poolFeeTier, tickSpacing);

        _initializePool(poolKey, PriceLib.clearingPriceToSqrtPriceX96(clearingPrice, token, paymentToken));

        (int24 tickLower, int24 tickUpper) = PoolKeyLib.getFullRangeTicks(tickSpacing);
        positionTokenId = _mintLPPosition(poolKey, tickLower, tickUpper, tokenAmount, paymentAmount);
    }

    function _deployAndTransfer(
        uint256 positionTokenId_,
        VaultConfig calldata vaultConfig,
        address token,
        address paymentToken
    ) internal returns (address vault) {
        vault = _deployVault(positionTokenId_, vaultConfig, token, paymentToken);
        _transferPositionToVault(vault, positionTokenId_);
    }

    // ============================================
    // INTERNAL — Pool Initialization (virtual for testing)
    // ============================================

    function _initializePool(PoolKey memory poolKey, uint160 sqrtPriceX96) internal virtual {
        poolManager.initialize(poolKey, sqrtPriceX96);
    }

    // ============================================
    // INTERNAL — LP Position Minting (virtual for testing)
    // ============================================

    /// @dev Mints a full-range LP position. Override in tests to use mock.
    function _mintLPPosition(
        PoolKey memory, /* poolKey */
        int24, /* tickLower */
        int24, /* tickUpper */
        uint256, /* tokenAmount */
        uint256 /* paymentAmount */
    )
        internal
        virtual
        returns (uint256)
    {
        // In production, this encodes V4 Actions (MINT_POSITION + SETTLE_PAIR)
        // and calls positionManager.modifyLiquidities(...)
        //
        // For V1 PoC, this is a virtual function overridden in tests.
        // Production V4 encoding will be added for fork tests.
        revert("PostAuctionHandler: _mintLPPosition not implemented");
    }

    // ============================================
    // INTERNAL — Vault Deployment (virtual for testing)
    // ============================================

    function _deployVault(uint256, VaultConfig calldata, address, address) internal virtual returns (address) {
        // Deploy vault — production version uses new LaunchLiquidityVault(...)
        // For V1 PoC, this is virtual to allow test overrides.
        revert("PostAuctionHandler: _deployVault not implemented");
    }

    // ============================================
    // INTERNAL — Position Transfer
    // ============================================

    function _transferPositionToVault(address vault, uint256 positionTokenId_) internal virtual {
        bytes4 sig = bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
        (bool success,) = positionManager.call(abi.encodeWithSelector(sig, address(this), vault, positionTokenId_));
        require(success, "PostAuctionHandler: NFT transfer failed");
    }

    // ============================================
    // INTERNAL — Lockup Deployment
    // ============================================

    function _deployLockup(address vault, address beneficiary, uint64 lockupDuration) internal virtual {
        uint64 unlockTimestamp = uint64(block.timestamp) + lockupDuration;
        (bool success,) = lockupFactory.call(
            abi.encodeWithSignature("createLockup(address,address,uint64)", vault, beneficiary, unlockTimestamp)
        );
        require(success, "PostAuctionHandler: lockup deployment failed");
    }

    // ============================================
    // ERC721 Receiver
    // ============================================

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
