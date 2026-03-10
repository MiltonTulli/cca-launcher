// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice Minimal mock of Uniswap V4 PositionManager for testing
/// @dev Mints ERC721 tokens to simulate LP position NFTs
contract MockPositionManager is ERC721 {
    uint256 private _nextTokenId = 1;

    constructor() ERC721("MockPosition", "MPOS") {}

    /// @notice Mint a position NFT to the caller
    function mintPosition(address to) external returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _mint(to, tokenId);
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
}
