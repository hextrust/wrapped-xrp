import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { useBigBlock, useSmallBlock } from '@layerzerolabs/hyperliquid-composer'
import { EndpointId, endpointIdToNetwork } from '@layerzerolabs/lz-definitions'
import { getDeploymentAddressAndAbi } from '@layerzerolabs/lz-evm-sdk-v2'

import { loadHreWallet } from '../utils/wallet'

const contractName = 'WXRPMintBurnOFTAdapter'

export const deployMaba = async (hre: HardhatRuntimeEnvironment) => {
    const { deploy } = hre.deployments
    const signer = (await hre.ethers.getSigners())[0]
    console.log(`Deploying ${contractName} on network: ${hre.network.name} with ${signer.address}`)

    const eid = hre.network.config.eid
    if (!eid) throw new Error('Network EID is not defined in Hardhat config')

    const isHyperEvmTestnet = eid === EndpointId.HYPERLIQUID_V2_TESTNET
    const isHyperEvmMainnet = eid === EndpointId.HYPERLIQUID_V2_MAINNET
    const isHyperEvm = isHyperEvmTestnet || isHyperEvmMainnet

    const wallet = isHyperEvm ? loadHreWallet(hre) : undefined
    const logLevel = hre.hardhatArguments.verbose ? 'debug' : 'error'

    const lzNetworkName = endpointIdToNetwork(eid)

    const { address: wxrpTokenAddress } = await hre.deployments.get('WXRPToken')
    const { address: endpointAddress } = getDeploymentAddressAndAbi(lzNetworkName, 'EndpointV2')

    // This contract requires >1.5M gas to deploy. Switching to big blocks in HyperEVM.
    const deployment = await hre.deployments.getOrNull(contractName)
    if (isHyperEvm && !deployment) await useBigBlock(wallet!, isHyperEvmTestnet, logLevel, true)

    const result = await deploy(contractName, {
        from: signer.address,
        args: [wxrpTokenAddress, wxrpTokenAddress, endpointAddress, signer.address],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: false,
    })

    if (isHyperEvm && !deployment) await useSmallBlock(wallet!, isHyperEvmTestnet, logLevel, true)

    return result
}

export const deploy: DeployFunction = async (hre) => {
    await deployMaba(hre)
}

deploy.tags = [contractName]

export default deploy
