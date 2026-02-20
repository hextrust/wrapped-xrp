import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { OAppEnforcedOption } from '@layerzerolabs/toolbox-hardhat'

// These are not the selected DVNs, but they are used to mimic the 2/4 optional DVNs
// set-up as best as possible, as only 3 DVNs support Sepolia <-> HyperEVM Testnet
// and only 2 DVNs that supports Solana <-> *.
export const OPTIONAL_DVNS: Record<string, Partial<Record<EndpointId, string>>> = {
    LAYERZERO_LABS: {
        [EndpointId.SEPOLIA_V2_TESTNET]: '0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193',
        [EndpointId.HYPERLIQUID_V2_TESTNET]: '0x91e698871030d0e1b6c9268c20bb57e2720618dd',
        [EndpointId.SOLANA_V2_TESTNET]: '4VDjp6XQaxoZf5RGwiPU9NR1EXSZn2TP4ATMmiSzLfhb',
    },
    MANTLE01: {
        [EndpointId.SEPOLIA_V2_TESTNET]: '0x6943872cfc48f6b18f8b81d57816733d4545eca3',
        [EndpointId.HYPERLIQUID_V2_TESTNET]: '0x003bd8adc7ba8a7353b950541904b61011e38dae',
    },
    P2P: {
        [EndpointId.SEPOLIA_V2_TESTNET]: '0x9efba56c8598853e5b40fd9a66b54a6c163742d7',
        [EndpointId.HYPERLIQUID_V2_TESTNET]: '0x4c90f152707c6eab6cd801e326d25b0591e449a2',
        [EndpointId.SOLANA_V2_TESTNET]: '29EKzmCscUg8mf4f5uskwMqvu2SXM8hKF1gWi1cCBoKT',
    },
}

export const OPTIONAL_DVNS_THRESHOLD = 2

// Chain default confirmations.
export const CONFIRMATIONS: Partial<Record<EndpointId, number>> = {
    [EndpointId.SEPOLIA_V2_TESTNET]: 2,
    [EndpointId.HYPERLIQUID_V2_TESTNET]: 1,
    [EndpointId.SOLANA_V2_TESTNET]: 10,
}

const DEFAULT_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    { msgType: 1, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 120000, value: 0 },
]

// Define enforced options per specific endpoint ID.
export const ENFORCED_OPTIONS: Partial<Record<EndpointId, OAppEnforcedOption[]>> = {
    [EndpointId.SEPOLIA_V2_TESTNET]: DEFAULT_ENFORCED_OPTIONS,
    [EndpointId.HYPERLIQUID_V2_TESTNET]: DEFAULT_ENFORCED_OPTIONS,
    [EndpointId.SOLANA_V2_TESTNET]: [
        { msgType: 1, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 200_000, value: 2_500_000 },
        { msgType: 2, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 200_000, value: 2_500_000 },
    ],
}

export const OWNERS: Partial<Record<EndpointId, string>> = {
    [EndpointId.SEPOLIA_V2_TESTNET]: '0xa4B4c951E9Fae331c65700C9BB6A21c236fcF165',
    [EndpointId.HYPERLIQUID_V2_TESTNET]: '0xa4B4c951E9Fae331c65700C9BB6A21c236fcF165',
    [EndpointId.SOLANA_V2_TESTNET]: 'Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob', // $SQUADS_VAULT_ADDR
} as const

export const getRequiredDVNs = (_eid: EndpointId): string[] => {
    return [] as string[]
}

export const getOptionalDVNs = (fromEid: EndpointId, toEid: EndpointId): string[] =>
    Object.values(OPTIONAL_DVNS)
        // Gets optional dvn only if it supports both eids
        .map((dvnMap) => (dvnMap[toEid] ? dvnMap[fromEid] : null))
        .filter(Boolean) as string[]
export const getEnforcedOptions = (eid: EndpointId): OAppEnforcedOption[] => {
    return ENFORCED_OPTIONS[eid] ?? DEFAULT_ENFORCED_OPTIONS
}

export const getOwnerAddress = (eid: EndpointId): string => {
    const address = OWNERS[eid]
    if (!address || address === 'TODO' || address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Owner address not configured for endpoint ${eid}`)
    }
    return address
}
