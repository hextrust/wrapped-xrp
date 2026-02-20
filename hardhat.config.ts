// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-verify'
import '@layerzerolabs/toolbox-hardhat'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import './tasks/transferErc20AdminRole'
import './tasks/transferProxyAdminRole'

import './tasks/index'

// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
      ? [PRIVATE_KEY]
      : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    evmVersion: 'paris',
                    optimizer: {
                        enabled: true,
                        runs: 20_000,
                    },
                },
            },
        ],
    },
    networks: {
        ethereum: {
            eid: EndpointId.ETHEREUM_V2_MAINNET,
            url: process.env.RPC_URL_ETHEREUM || 'https://mainnet.gateway.tenderly.co',
            accounts,
        },
        hyperevm: {
            eid: EndpointId.HYPERLIQUID_V2_MAINNET,
            url: process.env.RPC_URL_HYPEREVM || 'https://rpc.hyperliquid.xyz/evm',
            accounts,
        },
        optimism: {
            eid: EndpointId.OPTIMISM_V2_MAINNET,
            url: process.env.RPC_URL_OPTIMISM || 'https://optimism-rpc.publicnode.com',
            accounts,
        },
        'ethereum-testnet': {
            eid: EndpointId.SEPOLIA_V2_TESTNET,
            url: process.env.RPC_URL_ETHEREUM_TESTNET || 'https://sepolia.gateway.tenderly.co',
            accounts,
        },
        'hyperevm-testnet': {
            eid: EndpointId.HYPERLIQUID_V2_TESTNET,
            url: process.env.RPC_URL_HYPEREVM_TESTNET || 'https://rpc.hyperliquid-testnet.xyz/evm',
            accounts,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    etherscan: {
        apiKey: {
            ethereum: process.env.ETHERSCAN_API_KEY || 'unset',
            hyperevm: process.env.ETHERSCAN_API_KEY || 'unset',
            optimism: process.env.ETHERSCAN_API_KEY || 'unset',
        },
        customChains: [
            {
                network: 'ethereum',
                chainId: 1,
                urls: {
                    apiURL: 'https://api.etherscan.io/v2/api?chainid=1',
                    browserURL: 'https://etherscan.io',
                },
            },
            {
                network: 'hyperevm',
                chainId: 999,
                urls: {
                    apiURL: 'https://api.etherscan.io/v2/api?chainid=999',
                    browserURL: 'https://hyperevmscan.io/',
                },
            },
            {
                network: 'optimism',
                chainId: 10,
                urls: {
                    apiURL: 'https://api.etherscan.io/v2/api?chainid=10',
                    browserURL: 'https://optimistic.etherscan.io/',
                },
            },
        ],
    },
}

export default config
