// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {TestBase} from "./helpers/TestBase.sol";
import {LaunchFactory} from "../src/LaunchFactory.sol";
import {OrchestratorDeployer} from "../src/OrchestratorDeployer.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {ILaunchFactory} from "../src/interfaces/ILaunchFactory.sol";
import {LaunchParams, PlatformFeeConfig} from "../src/types/LaunchTypes.sol";
import {ZeroAddress, NotPlatformAdmin, NotPendingPlatformAdmin} from "../src/errors/LaunchErrors.sol";

contract LaunchFactoryTest is TestBase {
    LaunchFactory public launchFactory;
    OrchestratorDeployer public deployer;
    TokenFactory public tokenFactory;
    address public mockPostAuctionHandler = makeAddr("postAuctionHandler");

    function setUp() public override {
        super.setUp();

        tokenFactory = new TokenFactory(TOKEN_CREATION_FEE, platformFeeRecipient);
        deployer = new OrchestratorDeployer();

        PlatformFeeConfig memory feeConfig_ = createDefaultPlatformFeeConfig();

        launchFactory = new LaunchFactory(
            platformAdmin,
            feeConfig_,
            address(deployer),
            address(ccaFactory),
            mockPostAuctionHandler,
            address(tokenFactory)
        );

        vm.label(address(launchFactory), "LaunchFactory");
        vm.label(address(deployer), "OrchestratorDeployer");
    }

    function test_createLaunch_happyPath() public {
        LaunchParams memory params = createDefaultLaunchParams();

        (uint256 launchId, address launcher) = launchFactory.createLaunch(params);

        assertEq(launchId, 0, "First launch should have ID 0");
        assertTrue(launcher != address(0), "Launcher should be deployed");
        assertEq(launchFactory.getLaunch(0), launcher, "getLaunch should return the launcher");
        assertEq(launchFactory.launchCount(), 1, "launchCount should be 1");
    }

    function test_createLaunch_emitsEvent() public {
        LaunchParams memory params = createDefaultLaunchParams();

        vm.expectEmit(true, false, true, true);
        emit ILaunchFactory.LaunchCreated(0, address(0), operator, address(auctionToken), address(paymentToken));
        launchFactory.createLaunch(params);
    }

    function test_createLaunch_multipleRegistered() public {
        LaunchParams memory params = createDefaultLaunchParams();

        (uint256 id1,) = launchFactory.createLaunch(params);
        (uint256 id2,) = launchFactory.createLaunch(params);
        (uint256 id3,) = launchFactory.createLaunch(params);

        assertEq(id1, 0);
        assertEq(id2, 1);
        assertEq(id3, 2);
        assertEq(launchFactory.launchCount(), 3);
    }

    function test_getLaunchesByOperator() public {
        LaunchParams memory params = createDefaultLaunchParams();

        launchFactory.createLaunch(params);
        launchFactory.createLaunch(params);

        uint256[] memory ids = launchFactory.getLaunchesByOperator(operator);
        assertEq(ids.length, 2);
        assertEq(ids[0], 0);
        assertEq(ids[1], 1);
    }

    function test_createLaunch_revertsZeroOperator() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.operator = address(0);

        vm.expectRevert(ZeroAddress.selector);
        launchFactory.createLaunch(params);
    }

    function test_createLaunch_allowsNativeEthPaymentToken() public {
        LaunchParams memory params = createDefaultLaunchParams();
        params.paymentToken = address(0); // native ETH

        (uint256 launchId, address launcher) = launchFactory.createLaunch(params);
        assertTrue(launcher != address(0), "Launcher should be deployed with native ETH payment");
        assertEq(launchId, 0);
    }

    function test_updateFeeConfig_onlyAdmin() public {
        PlatformFeeConfig memory newConfig = createDefaultPlatformFeeConfig();
        newConfig.saleFeeBps = 1000;

        vm.prank(platformAdmin);
        launchFactory.updateFeeConfig(newConfig);

        PlatformFeeConfig memory stored = launchFactory.feeConfig();
        assertEq(stored.saleFeeBps, 1000);
    }

    function test_updateFeeConfig_revertsNonAdmin() public {
        PlatformFeeConfig memory newConfig = createDefaultPlatformFeeConfig();

        vm.prank(user1);
        vm.expectRevert(NotPlatformAdmin.selector);
        launchFactory.updateFeeConfig(newConfig);
    }

    function test_transferPlatformAdmin_twoStep() public {
        vm.prank(platformAdmin);
        launchFactory.transferPlatformAdmin(user1);

        assertEq(launchFactory.pendingPlatformAdmin(), user1);
        assertEq(launchFactory.platformAdmin(), platformAdmin); // not yet changed

        vm.prank(user1);
        launchFactory.acceptPlatformAdmin();

        assertEq(launchFactory.platformAdmin(), user1);
        assertEq(launchFactory.pendingPlatformAdmin(), address(0));
    }

    function test_acceptPlatformAdmin_revertsNonPending() public {
        vm.prank(platformAdmin);
        launchFactory.transferPlatformAdmin(user1);

        vm.prank(user2);
        vm.expectRevert(NotPendingPlatformAdmin.selector);
        launchFactory.acceptPlatformAdmin();
    }

    function test_feeConfigSnapshot_isolatedPerLaunch() public {
        LaunchParams memory params = createDefaultLaunchParams();

        // Create first launch with 5% fee
        launchFactory.createLaunch(params);

        // Update fee to 10%
        vm.prank(platformAdmin);
        PlatformFeeConfig memory newConfig = createDefaultPlatformFeeConfig();
        newConfig.saleFeeBps = 1000;
        launchFactory.updateFeeConfig(newConfig);

        // Create second launch — should get 10% snapshot
        launchFactory.createLaunch(params);

        // Both launches exist
        assertEq(launchFactory.launchCount(), 2);
    }
}
