// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title ILaunchLiquidityVault
/// @notice Custodian of LP position NFT with fee collection and split
interface ILaunchLiquidityVault {
    event FeesCollected(uint256 fee0, uint256 fee1);
    event FeesSplit(uint256 platformFee0, uint256 platformFee1, uint256 creatorFee0, uint256 creatorFee1);
    event PositionWithdrawn(address indexed to, uint256 tokenId);

    /// @notice Collect and split LP fees (permissionless)
    /// @dev Anyone can call. Funds always go to configured beneficiaries.
    function collectAndSplitFees() external;

    /// @notice Withdraw the LP position NFT
    /// @dev Blocked if lockup is active
    function withdrawPosition(address to) external;

    /// @notice The NFT token ID of the held LP position
    function positionTokenId() external view returns (uint256);

    /// @notice Whether the position can be withdrawn
    function isWithdrawable() external view returns (bool);
}
