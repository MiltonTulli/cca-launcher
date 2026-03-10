// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICCA} from "../../src/interfaces/ICCA.sol";

/// @notice Mock CCA auction for testing
contract MockCCA is ICCA {
    uint256 private _clearingPrice;
    uint256 private _currencyRaised;
    uint64 private _endBlock;
    uint64 private _claimBlock;
    uint128 private _totalSupply;
    address private _token;
    address private _currency;
    bool private _graduated;
    address private _tokensRecipient;
    address private _fundsRecipient;

    bool public checkpointCalled;
    bool public sweepUnsoldTokensCalled;
    bool public sweepCurrencyCalled;

    constructor(address token_, address currency_, address fundsRecipient_, uint64 endBlock_) {
        _token = token_;
        _currency = currency_;
        _fundsRecipient = fundsRecipient_;
        _tokensRecipient = fundsRecipient_;
        _endBlock = endBlock_;
    }

    // ============================================
    // TEST SETTERS
    // ============================================

    function setClearingPrice(uint256 price) external {
        _clearingPrice = price;
    }

    function setCurrencyRaised(uint256 amount) external {
        _currencyRaised = amount;
    }

    function setGraduated(bool graduated_) external {
        _graduated = graduated_;
    }

    function setTotalSupply(uint128 supply) external {
        _totalSupply = supply;
    }

    function setTokensRecipient(address recipient) external {
        _tokensRecipient = recipient;
    }

    // ============================================
    // ICCA IMPLEMENTATION
    // ============================================

    function clearingPrice() external view override returns (uint256) {
        return _clearingPrice;
    }

    function currencyRaised() external view override returns (uint256) {
        return _currencyRaised;
    }

    function endBlock() external view override returns (uint64) {
        return _endBlock;
    }

    function claimBlock() external view override returns (uint64) {
        return _claimBlock;
    }

    function totalSupply() external view override returns (uint128) {
        return _totalSupply;
    }

    function token() external view override returns (address) {
        return _token;
    }

    function currency() external view override returns (address) {
        return _currency;
    }

    function isGraduated() external view override returns (bool) {
        return _graduated;
    }

    function tokensRecipient() external view override returns (address) {
        return _tokensRecipient;
    }

    function fundsRecipient() external view override returns (address) {
        return _fundsRecipient;
    }

    function checkpoint() external override {
        checkpointCalled = true;
    }

    function sweepUnsoldTokens() external override {
        sweepUnsoldTokensCalled = true;
        // Transfer any remaining tokens to tokensRecipient
        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(_token).transfer(_tokensRecipient, balance);
        }
    }

    function sweepCurrency() external override {
        sweepCurrencyCalled = true;
        // Transfer raised currency to fundsRecipient
        if (_currency == address(0)) {
            // ETH
            (bool ok,) = _fundsRecipient.call{value: address(this).balance}("");
            require(ok);
        } else {
            uint256 balance = IERC20(_currency).balanceOf(address(this));
            if (balance > 0) {
                IERC20(_currency).transfer(_fundsRecipient, balance);
            }
        }
    }

    receive() external payable {}
}
