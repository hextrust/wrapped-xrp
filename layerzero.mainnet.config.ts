import { EndpointId } from '@layerzerolabs/lz-definitions'
import { OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

import {
    CONFIRMATIONS,
    OPTIONAL_DVNS_THRESHOLD,
    getEnforcedOptions,
    getOptionalDVNs,
    getOwnerAddress,
    getRequiredDVNs,
} from './consts/mainnet'
import { getOftStoreAddress } from './tasks/solana'

// Define all contracts.
export const CONTRACTS: OmniPointHardhat[] = [
    { eid: EndpointId.ETHEREUM_V2_MAINNET, contractName: 'WXRPMintBurnOFTAdapter' },
    { eid: EndpointId.HYPERLIQUID_V2_MAINNET, contractName: 'WXRPMintBurnOFTAdapter' },
    { eid: EndpointId.OPTIMISM_V2_MAINNET, contractName: 'WXRPMintBurnOFTAdapter' },
    { eid: EndpointId.SOLANA_V2_MAINNET, address: getOftStoreAddress(EndpointId.SOLANA_V2_MAINNET) },
]

// Generate all possible connections.
export const generateConnections = async () => {
    const connections = []

    // Generate all directional pairs first (including both directions).
    const pairs = []
    for (let i = 0; i < CONTRACTS.length; i++) {
        for (let j = 0; j < CONTRACTS.length; j++) {
            if (i !== j) {
                // Skip self-connections.
                pairs.push([CONTRACTS[i], CONTRACTS[j]]) // from -> to
            }
        }
    }

    // Iterate through all directional pairs.
    for (const [from, to] of pairs) {
        connections.push({
            from,
            to,
            config: {
                enforcedOptions: getEnforcedOptions(to.eid),
                sendConfig: {
                    ulnConfig: {
                        confirmations: CONFIRMATIONS[from.eid],
                        requiredDVNs: getRequiredDVNs(from.eid),
                        optionalDVNs: getOptionalDVNs(from.eid),
                        optionalDVNThreshold: OPTIONAL_DVNS_THRESHOLD,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: CONFIRMATIONS[to.eid],
                        requiredDVNs: getRequiredDVNs(from.eid),
                        optionalDVNs: getOptionalDVNs(from.eid),
                        optionalDVNThreshold: OPTIONAL_DVNS_THRESHOLD,
                    },
                },
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
            config: {
                owner: getOwnerAddress(contract.eid),
                delegate: getOwnerAddress(contract.eid),
            },
        })),
        connections,
    }
}
