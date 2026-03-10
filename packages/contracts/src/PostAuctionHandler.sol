// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";

import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";

import {IPostAuctionHandler} from "./interfaces/IPostAuctionHandler.sol";
import {VaultConfig} from "./types/LaunchTypes.sol";
import {LaunchLiquidityVault} from "./LaunchLiquidityVault.sol";
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

        // Sort amounts to match poolKey currency ordering (currency0 < currency1 by address)
        (uint256 amount0, uint256 amount1) =
            token < paymentToken ? (tokenAmount, paymentAmount) : (paymentAmount, tokenAmount);

        positionTokenId = _mintLPPosition(poolKey, tickLower, tickUpper, amount0, amount1);
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

    /// @dev Mints a full-range LP position via Uniswap V4 PositionManager.
    ///      Transfers tokens to the PositionManager, then encodes MINT_POSITION_FROM_DELTAS
    ///      + SETTLE (payerIsUser=false, tokens already in PM) + SWEEP (refund unused).
    ///      Override in tests to use mock.
    /// @param poolKey The Uniswap V4 pool key (currencies already sorted)
    /// @param tickLower Lower tick bound (aligned to tick spacing)
    /// @param tickUpper Upper tick bound (aligned to tick spacing)
    /// @param amount0 Amount of currency0 to provide (sorted order)
    /// @param amount1 Amount of currency1 to provide (sorted order)
    function _mintLPPosition(PoolKey memory poolKey, int24 tickLower, int24 tickUpper, uint256 amount0, uint256 amount1)
        internal
        virtual
        returns (uint256 positionTokenId)
    {
        // Get the next token ID (deterministic before minting)
        (bool okId, bytes memory idData) = positionManager.staticcall(abi.encodeWithSignature("nextTokenId()"));
        require(okId, "PostAuctionHandler: nextTokenId failed");
        positionTokenId = abi.decode(idData, (uint256));

        // Transfer tokens to PositionManager so SETTLE(payerIsUser=false) can pay the PoolManager
        IERC20(Currency.unwrap(poolKey.currency0)).safeTransfer(positionManager, amount0);
        IERC20(Currency.unwrap(poolKey.currency1)).safeTransfer(positionManager, amount1);

        // Encode action sequence:
        // 1. MINT_POSITION_FROM_DELTAS — creates LP, generates debt deltas
        // 2. SETTLE currency0 — PositionManager pays PoolManager from its own balance
        // 3. SETTLE currency1 — same
        // 4. SWEEP currency0 — return unused tokens to this contract
        // 5. SWEEP currency1 — same
        bytes memory actions = new bytes(5);
        actions[0] = bytes1(uint8(Actions.MINT_POSITION_FROM_DELTAS));
        actions[1] = bytes1(uint8(Actions.SETTLE));
        actions[2] = bytes1(uint8(Actions.SETTLE));
        actions[3] = bytes1(uint8(Actions.SWEEP));
        actions[4] = bytes1(uint8(Actions.SWEEP));

        bytes[] memory params = new bytes[](5);
        params[0] = abi.encode(
            poolKey,
            tickLower,
            tickUpper,
            type(uint128).max, // amount0Max — no slippage limit (new pool, we control price)
            type(uint128).max, // amount1Max
            address(this), // owner of the NFT (transferred to vault later)
            bytes("") // hookData
        );
        // SETTLE with payerIsUser=false: PositionManager is the payer (tokens already transferred there)
        // OPEN_DELTA (0) settles exact debt amount
        params[1] = abi.encode(poolKey.currency0, uint256(0), false);
        params[2] = abi.encode(poolKey.currency1, uint256(0), false);
        // SWEEP: return any unused tokens back to this contract
        params[3] = abi.encode(poolKey.currency0, address(this));
        params[4] = abi.encode(poolKey.currency1, address(this));

        (bool success,) = positionManager.call(
            abi.encodeWithSignature("modifyLiquidities(bytes,uint256)", abi.encode(actions, params), block.timestamp)
        );
        require(success, "PostAuctionHandler: modifyLiquidities failed");
    }

    // ============================================
    // INTERNAL — Vault Deployment (virtual for testing)
    // ============================================

    function _deployVault(
        uint256 positionTokenId_,
        VaultConfig calldata vaultConfig,
        address token,
        address paymentToken
    ) internal virtual returns (address) {
        // Sort tokens to match LP position currency ordering
        (address token0, address token1) = token < paymentToken ? (token, paymentToken) : (paymentToken, token);

        return address(
            new LaunchLiquidityVault(
                positionManager,
                positionTokenId_,
                vaultConfig.platformBeneficiary,
                vaultConfig.creatorBeneficiary,
                vaultConfig.platformFeeBps,
                token0,
                token1,
                msg.sender // owner = orchestrator (the caller)
            )
        );
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
