// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title ICCA
/// @notice Read interface for interacting with a deployed CCA auction
interface ICCA {
    /// @notice Current uniform clearing price
    function clearingPrice() external view returns (uint256);

    /// @notice Total currency raised so far
    function currencyRaised() external view returns (uint256);

    /// @notice Block at which the auction ends
    function endBlock() external view returns (uint64);

    /// @notice Block at which tokens become claimable
    function claimBlock() external view returns (uint64);

    /// @notice Total token supply in the auction
    function totalSupply() external view returns (uint128);

    /// @notice The token being auctioned
    function token() external view returns (address);

    /// @notice The currency used for bids
    function currency() external view returns (address);

    /// @notice Whether the auction has graduated (met minimum raise)
    function isGraduated() external view returns (bool);

    /// @notice Recipient of unsold tokens
    function tokensRecipient() external view returns (address);

    /// @notice Recipient of raised funds
    function fundsRecipient() external view returns (address);

    /// @notice Total tokens sold/allocated (from auction state, independent of claims)
    function totalCleared() external view returns (uint256);

    /// @notice Advance the auction state / finalize clearing price
    function checkpoint() external;

    /// @notice Transfer remaining unsold tokens to tokensRecipient
    function sweepUnsoldTokens() external;

    /// @notice Transfer raised currency to fundsRecipient
    function sweepCurrency() external;
}
