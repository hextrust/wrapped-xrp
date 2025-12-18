import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { OAppEnforcedOption } from '@layerzerolabs/toolbox-hardhat'

export const OPTIONAL_DVNS: Record<string, Partial<Record<EndpointId, string>>> = {
    CANARY: {
        [EndpointId.ETHEREUM_V2_MAINNET]: '0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd',
        [EndpointId.HYPERLIQUID_V2_MAINNET]: '0x83342ec538df0460e730a8f543fe63063e2d44c4',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0x5b6735c66d97479ccd18294fc96b3084ecb2fa3f',
        [EndpointId.SOLANA_V2_MAINNET]: '7jMeX5mzXnSSKYd8DxBDP4xMnkNFZZZm5W28FWUTbwU3',
    },
    DEUTSCHE_TELEKOM: {
        [EndpointId.ETHEREUM_V2_MAINNET]: '0x373a6e5c0c4e89e24819f00aa37ea370917aaff4',
        [EndpointId.HYPERLIQUID_V2_MAINNET]: '0x32ffd21260172518a8844fec76a88c8f239c384b',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0x427bd19a0463fc4edc2e247d35eb61323d7e5541',
        [EndpointId.SOLANA_V2_MAINNET]: 'FxFxe8j7e2xgpP9bw8LUehmz7DoQXaNFadJMEUKwBcRs',
    },
    LUGANODES: {
        [EndpointId.ETHEREUM_V2_MAINNET]: '0x58249a2ec05c1978bf21df1f5ec1847e42455cf4',
        [EndpointId.HYPERLIQUID_V2_MAINNET]: '0x9e451905f65ef78d62b93dac3513486da8429d0a',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0xd841a741addcb6dea735d3b8c9faf96ba3f3d30d',
        [EndpointId.SOLANA_V2_MAINNET]: '41QAdzUraTcvk1P2B6fcs5nQ4EeEKEGnQy5EPpCQ5AdX',
    },
    P2P: {
        [EndpointId.ETHEREUM_V2_MAINNET]: '0x06559ee34d85a88317bf0bfe307444116c631b67',
        [EndpointId.HYPERLIQUID_V2_MAINNET]: '0xc7423626016bc40375458bc0277f28681ec91c8e',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0x539008c98b17803a273edf98aba2d4414ee3f4d7',
        [EndpointId.SOLANA_V2_MAINNET]: '29EKzmCscUg8mf4f5uskwMqvu2SXM8hKF1gWi1cCBoKT',
    },
}

export const OPTIONAL_DVNS_THRESHOLD = 2

// Chain default confirmations.
export const CONFIRMATIONS: Partial<Record<EndpointId, number>> = {
    [EndpointId.ETHEREUM_V2_MAINNET]: 15,
    [EndpointId.HYPERLIQUID_V2_MAINNET]: 1,
    [EndpointId.OPTIMISM_V2_MAINNET]: 20,
    [EndpointId.SOLANA_V2_MAINNET]: 32,
}

const DEFAULT_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    { msgType: 1, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 100_000, value: 0 },
    { msgType: 2, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 100_000, value: 0 },
]

// Define enforced options per specific endpoint ID.
export const ENFORCED_OPTIONS: Partial<Record<EndpointId, OAppEnforcedOption[]>> = {
    [EndpointId.ETHEREUM_V2_MAINNET]: DEFAULT_ENFORCED_OPTIONS,
    [EndpointId.HYPERLIQUID_V2_MAINNET]: DEFAULT_ENFORCED_OPTIONS,
    [EndpointId.SOLANA_V2_MAINNET]: [
        { msgType: 1, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 200_000, value: 2_500_000 },
        { msgType: 2, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 200_000, value: 2_500_000 },
    ],
}

export const OWNERS: Partial<Record<EndpointId, string>> = {
    [EndpointId.ETHEREUM_V2_MAINNET]: '0xfA633B67b1d9371eBa32cf3476F275D75C75ce77',
    [EndpointId.HYPERLIQUID_V2_MAINNET]: '0xfA633B67b1d9371eBa32cf3476F275D75C75ce77',
    [EndpointId.OPTIMISM_V2_MAINNET]: '0xfA633B67b1d9371eBa32cf3476F275D75C75ce77',
    [EndpointId.SOLANA_V2_MAINNET]: 'FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E',
} as const

export const getRequiredDVNs = (_eid: EndpointId): string[] => {
    return [] as string[]
}

export const getOptionalDVNs = (eid: EndpointId): string[] => {
    return Object.values(OPTIONAL_DVNS)
        .map((dvnMap) => dvnMap[eid])
        .filter(Boolean) as string[]
}

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
