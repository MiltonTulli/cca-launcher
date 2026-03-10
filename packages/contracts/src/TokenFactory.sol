// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ITokenFactory} from "./interfaces/ITokenFactory.sol";
import {TokenCreationParams} from "./types/LaunchTypes.sol";
import {LaunchToken} from "./LaunchToken.sol";

/// @title TokenFactory
/// @notice Creates LaunchToken instances for CREATE_NEW launches
contract TokenFactory is ITokenFactory {
    /// @notice Fee charged for token creation (in ETH)
    uint256 public immutable tokenCreationFee;

    /// @notice Address that receives creation fees
    address public immutable feeRecipient;

    error InsufficientFee(uint256 required, uint256 provided);
    error FeeTransferFailed();

    constructor(uint256 tokenCreationFee_, address feeRecipient_) {
        tokenCreationFee = tokenCreationFee_;
        feeRecipient = feeRecipient_;
    }

    /// @inheritdoc ITokenFactory
    function createToken(TokenCreationParams calldata params, address minter)
        external
        payable
        override
        returns (address token)
    {
        if (msg.value < tokenCreationFee) {
            revert InsufficientFee(tokenCreationFee, msg.value);
        }

        // Deploy token with CREATE2 for deterministic addresses
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, params.name, params.symbol, block.number));

        LaunchToken newToken = new LaunchToken{salt: salt}(params.name, params.symbol, params.decimals, address(this));

        // Grant MINTER_ROLE to the specified minter (orchestrator)
        newToken.grantRole(newToken.MINTER_ROLE(), minter);

        // Transfer admin role to the minter so it can manage roles if needed
        newToken.grantRole(newToken.DEFAULT_ADMIN_ROLE(), minter);
        newToken.renounceRole(newToken.DEFAULT_ADMIN_ROLE(), address(this));

        token = address(newToken);

        // Forward fee to recipient
        if (tokenCreationFee > 0) {
            (bool ok,) = feeRecipient.call{value: tokenCreationFee}("");
            if (!ok) revert FeeTransferFailed();
        }

        // Refund excess ETH
        uint256 excess = msg.value - tokenCreationFee;
        if (excess > 0) {
            (bool ok,) = msg.sender.call{value: excess}("");
            if (!ok) revert FeeTransferFailed();
        }

        emit TokenDeployed(token, minter, params.name, params.symbol);
    }
}
