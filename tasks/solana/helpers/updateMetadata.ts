import { findMetadataPda, fetchMetadata, updateMetadataAccountV2 } from '@metaplex-foundation/mpl-token-metadata'
import { createNoopSigner, publicKey } from '@metaplex-foundation/umi'
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters'
import { TOKEN_PROGRAM_ID, createUpdateFieldInstruction } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { task } from 'hardhat/config'

import { types as devtoolsTypes } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { deriveConnection } from '..'
import { SolanaTokenProgramType, getSolanaTokenMetadata, tokenProgramAddressToType } from '../../common/utils'

import { printBase58Tx } from './utils'

interface TxTaskArgs {
    eid: EndpointId
    tokenAddr: string
    squadsAddr: string
    field: string
    value: string
}

task('lz:solana:update-metadata', 'Updates the metadata of a token')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168) eid', undefined, devtoolsTypes.eid, false)
    .addParam('tokenAddr', 'The mint address of the token to mint', undefined, devtoolsTypes.string, false)
    .addParam('squadsAddr', 'The squads address to use for the mint', undefined, devtoolsTypes.string, false)
    .addParam('field', 'The field to update - Name, Symbol, Uri', undefined, devtoolsTypes.string, false)
    .addParam('value', 'The value to update the field to', undefined, devtoolsTypes.string, false)
    .setAction(async ({ eid, tokenAddr, squadsAddr, field, value }: TxTaskArgs) => {
        const { umi, connection } = await deriveConnection(eid)

        const mintPubkey = new PublicKey(tokenAddr)
        const mintAccount = await connection.getAccountInfo(mintPubkey)
        
        if (!mintAccount) {
            throw new Error(`Mint account not found: ${tokenAddr}`)
        }

        const tokenProgramType = tokenProgramAddressToType(mintAccount.owner)
        const squadsPubkey = new PublicKey(squadsAddr)
        let ix: any

        if (tokenProgramType === SolanaTokenProgramType.SPL) {
            const mintUmi = publicKey(tokenAddr)
            const tokenMetadata = await getSolanaTokenMetadata(umi, mintUmi, tokenProgramType)
            
            if (!tokenMetadata?.updateAuthority) {
                throw new Error('No Metaplex metadata found for this token. Cannot update metadata.')
            }

            const metadataPda = findMetadataPda(umi, { mint: mintUmi })

            const metadataAccount = await fetchMetadata(umi, metadataPda)
            
            if (!metadataAccount) {
                throw new Error('Failed to fetch metadata account')
            }

            const fieldMap: Record<string, 'name' | 'symbol' | 'uri'> = {
                Name: 'name',
                Symbol: 'symbol',
                Uri: 'uri',
            }

            const metaplexField = fieldMap[field]
            if (!metaplexField) {
                throw new Error(`Invalid field: ${field}. Must be one of: Name, Symbol, Uri`)
            }

            const updateIx = updateMetadataAccountV2(umi, {
                metadata: metadataPda,
                updateAuthority: createNoopSigner(publicKey(squadsAddr)),
                data: {
                    name: metaplexField === 'name' ? value : (metadataAccount.name ?? ''),
                    symbol: metaplexField === 'symbol' ? value : (metadataAccount.symbol ?? ''),
                    uri: metaplexField === 'uri' ? value : (metadataAccount.uri ?? ''),
                    sellerFeeBasisPoints: metadataAccount.sellerFeeBasisPoints ?? 0,
                    creators: metadataAccount.creators ?? null,
                    collection: metadataAccount.collection ?? null,
                    uses: metadataAccount.uses ?? null,
                },
            })

            const umiInstruction = updateIx.getInstructions()[0]
            ix = toWeb3JsInstruction(umiInstruction)

            const updateAuthorityKeyIndex = ix.keys.findIndex(
                (key: any) => key.pubkey.equals(squadsPubkey) && key.isSigner
            )
            
            if (updateAuthorityKeyIndex !== -1) {
                ix.keys[updateAuthorityKeyIndex] = {
                    pubkey: squadsPubkey,
                    isSigner: true,
                    isWritable: false,
                }
            }
        } else {
            throw new Error(`Unsupported token program type: ${tokenProgramType}`)
        }

        await printBase58Tx(ix, umi, squadsAddr)
    })
