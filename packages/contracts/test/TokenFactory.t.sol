// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {LaunchToken} from "../src/LaunchToken.sol";
import {ITokenFactory} from "../src/interfaces/ITokenFactory.sol";
import {TokenCreationParams} from "../src/types/LaunchTypes.sol";

contract TokenFactoryTest is Test {
    TokenFactory public factory;

    address public feeRecipient = makeAddr("feeRecipient");
    address public minter = makeAddr("minter");
    uint256 public constant FEE = 0.01 ether;

    function setUp() public {
        factory = new TokenFactory(FEE, feeRecipient);
    }

    function _defaultParams() internal pure returns (TokenCreationParams memory) {
        return TokenCreationParams({
            name: "Test Token", symbol: "TEST", decimals: 18, initialSupply: 0, initialHolder: address(0)
        });
    }

    function test_createToken_deploysCorrectly() public {
        TokenCreationParams memory params = _defaultParams();

        address token = factory.createToken{value: FEE}(params, minter);

        assertTrue(token != address(0), "Token should be deployed");
        assertEq(LaunchToken(token).name(), "Test Token");
        assertEq(LaunchToken(token).symbol(), "TEST");
        assertEq(LaunchToken(token).decimals(), 18);
    }

    function test_createToken_grantsMinterRole() public {
        TokenCreationParams memory params = _defaultParams();

        address token = factory.createToken{value: FEE}(params, minter);

        LaunchToken lt = LaunchToken(token);
        assertTrue(lt.hasRole(lt.MINTER_ROLE(), minter), "Minter should have MINTER_ROLE");
        assertTrue(lt.hasRole(lt.DEFAULT_ADMIN_ROLE(), minter), "Minter should have DEFAULT_ADMIN_ROLE");
        assertFalse(
            lt.hasRole(lt.DEFAULT_ADMIN_ROLE(), address(factory)), "Factory should have renounced DEFAULT_ADMIN_ROLE"
        );
    }

    function test_createToken_minterCanMint() public {
        TokenCreationParams memory params = _defaultParams();
        address token = factory.createToken{value: FEE}(params, minter);

        vm.prank(minter);
        LaunchToken(token).mint(address(this), 1000e18);

        assertEq(LaunchToken(token).balanceOf(address(this)), 1000e18);
    }

    function test_createToken_nonMinterCannotMint() public {
        TokenCreationParams memory params = _defaultParams();
        address token = factory.createToken{value: FEE}(params, minter);

        address notMinter = makeAddr("notMinter");
        vm.prank(notMinter);
        vm.expectRevert();
        LaunchToken(token).mint(address(this), 1000e18);
    }

    function test_createToken_chargesFee() public {
        TokenCreationParams memory params = _defaultParams();
        uint256 balanceBefore = feeRecipient.balance;

        factory.createToken{value: FEE}(params, minter);

        assertEq(feeRecipient.balance - balanceBefore, FEE, "Fee should be transferred to recipient");
    }

    function test_createToken_refundsExcess() public {
        TokenCreationParams memory params = _defaultParams();
        address caller = makeAddr("caller");
        vm.deal(caller, 1 ether);

        uint256 balanceBefore = caller.balance;
        vm.prank(caller);
        factory.createToken{value: 0.05 ether}(params, minter);

        assertEq(caller.balance, balanceBefore - FEE, "Only fee should be deducted, excess refunded");
    }

    function test_createToken_revertsInsufficientFee() public {
        TokenCreationParams memory params = _defaultParams();

        vm.expectRevert(abi.encodeWithSelector(TokenFactory.InsufficientFee.selector, FEE, FEE - 1));
        factory.createToken{value: FEE - 1}(params, minter);
    }

    function test_createToken_emitsEvent() public {
        TokenCreationParams memory params = _defaultParams();

        vm.expectEmit(false, true, false, true);
        emit ITokenFactory.TokenDeployed(address(0), minter, "Test Token", "TEST");
        factory.createToken{value: FEE}(params, minter);
    }

    function test_createToken_customDecimals() public {
        TokenCreationParams memory params = _defaultParams();
        params.decimals = 6;
        params.name = "USDC-like";
        params.symbol = "USDC6";

        address token = factory.createToken{value: FEE}(params, minter);

        assertEq(LaunchToken(token).decimals(), 6);
        assertEq(LaunchToken(token).name(), "USDC-like");
    }

    function test_createToken_zeroFeeFactory() public {
        TokenFactory zeroFeeFactory = new TokenFactory(0, feeRecipient);
        TokenCreationParams memory params = _defaultParams();

        address token = zeroFeeFactory.createToken(params, minter);
        assertTrue(token != address(0));
    }
}
