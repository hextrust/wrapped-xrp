/**
 * Note:
 *
 * This config is part of the migration to the new spl token solana OFT.
 * It can be deleted once de-wiring of the outdated token2022 OFT is successfully completed.
 */
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const previousSolanaOftStoreAddress = '44F6EuNhHYmt7JRXvjzw5vJjGogdeVHRw1BQBEQ9NxBT'
const blockedMsgLibOnSolana = '2XrYqmhBMPJgDsb4SVbjV1PnJBprurd5bzRCkHwiFCJB'

// Define all contracts.
export const CONTRACTS: OmniPointHardhat[] = [
    { eid: EndpointId.SEPOLIA_V2_TESTNET, contractName: 'WXRPMintBurnOFTAdapter' },
    { eid: EndpointId.HYPERLIQUID_V2_TESTNET, contractName: 'WXRPMintBurnOFTAdapter' },
    { eid: EndpointId.SOLANA_V2_TESTNET, address: previousSolanaOftStoreAddress },
]

// Generate connections only from Solana devnet to EVM testnet chains
export const generateConnections = async () => {
    const connections = []
    const solanaContract = CONTRACTS.find((contract) => contract.eid === EndpointId.SOLANA_V2_TESTNET)
    const evmContracts = CONTRACTS.filter((contract) => contract.eid !== EndpointId.SOLANA_V2_TESTNET)

    if (!solanaContract) {
        throw new Error('Solana contract not found in CONTRACTS')
    }

    // Generate connections from Solana to all EVM chains.
    for (const evmContract of evmContracts) {
        connections.push({
            from: solanaContract,
            to: evmContract,
            config: {
                sendLibrary: blockedMsgLibOnSolana,
            },
        })
    }

    return connections
}

export default async function () {
    const connections = await generateConnections()

    return {
        contracts: CONTRACTS.map((contract) => ({
            contract,
        })),
        connections,
    }
}
