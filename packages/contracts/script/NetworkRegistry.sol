// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title NetworkRegistry
/// @notice Resolves known contract addresses per chain
abstract contract NetworkRegistry {
    struct NetworkConfig {
        address poolManager;
        address positionManager;
        address ccaFactory;
    }

    address constant CCA_FACTORY = 0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5;

    function _getNetworkConfig() internal view returns (NetworkConfig memory) {
        return _getNetworkConfig(block.chainid);
    }

    function _getNetworkConfig(uint256 networkId) internal pure returns (NetworkConfig memory) {
        // Sepolia
        if (networkId == 11_155_111) {
            return NetworkConfig({
                poolManager: 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543,
                positionManager: 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4,
                ccaFactory: CCA_FACTORY
            });
        }
        // Ethereum Mainnet
        if (networkId == 1) {
            return NetworkConfig({
                poolManager: 0x000000000004444c5dc75cB358380D2e3dE08A90,
                positionManager: 0xbD216513d74C8cf14cf4747E6AaA6420FF64ee9e,
                ccaFactory: CCA_FACTORY
            });
        }
        // Arbitrum One
        if (networkId == 42_161) {
            return NetworkConfig({
                poolManager: 0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32,
                positionManager: 0xd88F38F930b7952f2DB2432Cb002E7abbF3dD869,
                ccaFactory: CCA_FACTORY
            });
        }
        // Arbitrum Sepolia
        if (networkId == 421_614) {
            return NetworkConfig({
                poolManager: 0xFB3e0C6F74eB1a21CC1Da29aeC80D2Dfe6C9a317,
                positionManager: 0xAc631556d3d4019C95769033B5E719dD77124BAc,
                ccaFactory: CCA_FACTORY
            });
        }
        revert("NetworkRegistry: unsupported chain");
    }
}
