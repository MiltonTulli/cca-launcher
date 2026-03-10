// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILaunchFactory} from "./interfaces/ILaunchFactory.sol";
import {IOrchestratorDeployer} from "./interfaces/IOrchestratorDeployer.sol";
import {LaunchParams, PlatformFeeConfig} from "./types/LaunchTypes.sol";
import {ZeroAddress, NotPlatformAdmin, NotPendingPlatformAdmin} from "./errors/LaunchErrors.sol";

/// @title LaunchFactory
/// @notice Creates and registers launches. Holds global platform config.
contract LaunchFactory is ILaunchFactory {
    // ============================================
    // STATE
    // ============================================

    mapping(uint256 => address) public launches;
    mapping(address => uint256[]) private _operatorLaunches;
    uint256 public override launchCount;

    PlatformFeeConfig private _feeConfig;

    address public platformAdmin;
    address public pendingPlatformAdmin;

    IOrchestratorDeployer public orchestratorDeployer;
    address public auctionInitializer;
    address public postAuctionHandler;
    address public tokenFactory;

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyPlatformAdmin() {
        if (msg.sender != platformAdmin) revert NotPlatformAdmin();
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(
        address platformAdmin_,
        PlatformFeeConfig memory feeConfig_,
        address orchestratorDeployer_,
        address auctionInitializer_,
        address postAuctionHandler_,
        address tokenFactory_
    ) {
        if (platformAdmin_ == address(0)) revert ZeroAddress();
        if (feeConfig_.feeRecipient == address(0)) revert ZeroAddress();

        platformAdmin = platformAdmin_;
        _feeConfig = feeConfig_;
        orchestratorDeployer = IOrchestratorDeployer(orchestratorDeployer_);
        auctionInitializer = auctionInitializer_;
        postAuctionHandler = postAuctionHandler_;
        tokenFactory = tokenFactory_;
    }

    // ============================================
    // LAUNCH CREATION
    // ============================================

    /// @inheritdoc ILaunchFactory
    function createLaunch(LaunchParams calldata params)
        external
        override
        returns (uint256 launchId, address launcherAddress)
    {
        if (params.operator == address(0)) revert ZeroAddress();

        launchId = launchCount++;

        // Snapshot current fee config into the orchestrator
        launcherAddress = orchestratorDeployer.deploy(
            launchId,
            params,
            _feeConfig.saleFeeBps,
            auctionInitializer,
            postAuctionHandler,
            tokenFactory,
            _feeConfig.feeRecipient,
            _feeConfig.lpFeeShareBps
        );

        launches[launchId] = launcherAddress;
        _operatorLaunches[params.operator].push(launchId);

        emit LaunchCreated(launchId, launcherAddress, params.operator, params.token, params.paymentToken);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /// @inheritdoc ILaunchFactory
    function getLaunch(uint256 launchId) external view override returns (address) {
        return launches[launchId];
    }

    /// @inheritdoc ILaunchFactory
    function getLaunchesByOperator(address operatorAddr) external view override returns (uint256[] memory) {
        return _operatorLaunches[operatorAddr];
    }

    /// @inheritdoc ILaunchFactory
    function feeConfig() external view override returns (PlatformFeeConfig memory) {
        return _feeConfig;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /// @notice Update platform fee configuration
    function updateFeeConfig(PlatformFeeConfig calldata newConfig) external onlyPlatformAdmin {
        if (newConfig.feeRecipient == address(0)) revert ZeroAddress();
        _feeConfig = newConfig;
        emit PlatformFeeConfigUpdated(newConfig);
    }

    /// @notice Start platform admin transfer (two-step)
    function transferPlatformAdmin(address newAdmin) external onlyPlatformAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        pendingPlatformAdmin = newAdmin;
        emit PlatformAdminTransferStarted(platformAdmin, newAdmin);
    }

    /// @notice Accept platform admin role
    function acceptPlatformAdmin() external {
        if (msg.sender != pendingPlatformAdmin) revert NotPendingPlatformAdmin();
        address previous = platformAdmin;
        platformAdmin = msg.sender;
        pendingPlatformAdmin = address(0);
        emit PlatformAdminTransferred(previous, msg.sender);
    }

    /// @notice Update the orchestrator deployer
    function updateOrchestratorDeployer(address newDeployer) external onlyPlatformAdmin {
        if (newDeployer == address(0)) revert ZeroAddress();
        orchestratorDeployer = IOrchestratorDeployer(newDeployer);
    }

    /// @notice Update the auction initializer
    function updateAuctionInitializer(address newInitializer) external onlyPlatformAdmin {
        if (newInitializer == address(0)) revert ZeroAddress();
        auctionInitializer = newInitializer;
    }

    /// @notice Update the post-auction handler
    function updatePostAuctionHandler(address newHandler) external onlyPlatformAdmin {
        if (newHandler == address(0)) revert ZeroAddress();
        postAuctionHandler = newHandler;
    }

    /// @notice Update the token factory
    function updateTokenFactory(address newFactory) external onlyPlatformAdmin {
        if (newFactory == address(0)) revert ZeroAddress();
        tokenFactory = newFactory;
    }
}
