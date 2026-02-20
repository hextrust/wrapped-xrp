import { findMetadataPda, updateMetadataAccountV2 } from '@metaplex-foundation/mpl-token-metadata'
import { createNoopSigner, publicKey, transactionBuilder } from '@metaplex-foundation/umi'
import { fromWeb3JsInstruction, fromWeb3JsPublicKey, toWeb3JsInstruction, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
import { TOKEN_PROGRAM_ID, createUpdateAuthorityInstruction } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import { task } from 'hardhat/config'

import { types as devtoolsTypes } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { deriveConnection, getExplorerTxLink } from '..'
import { SolanaTokenProgramType, getSolanaTokenMetadata, tokenProgramAddressToType } from '../../common/utils'

import { printBase58Tx } from './utils'

interface TxTaskArgs {
    eid: EndpointId
    tokenAddr: string
    currentAuthority: string
    squadsAddr?: string
    signerAddr?: string
    newAuthorityAddr: string
    execute?: boolean
}

task('lz:solana:set-metadata-authority', 'Changes the metadata update authority of a token')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168) eid', undefined, devtoolsTypes.eid, false)
    .addParam('tokenAddr', 'The mint address of the token', undefined, devtoolsTypes.string, false)
    .addParam('currentAuthority', 'The current metadata update authority address (EOA or multisig vault)', undefined, devtoolsTypes.string, false)
    .addOptionalParam('squadsAddr', 'The squads vault address that is a signer of the multisig (only needed for multisig)', undefined, devtoolsTypes.string)
    .addOptionalParam('signerAddr', 'The signer address to use for the tx (only needed for multisig, usually same as squadsAddr)', undefined, devtoolsTypes.string)
    .addParam('newAuthorityAddr', 'The new metadata update authority address', undefined, devtoolsTypes.string, false)
    .addFlag('execute', 'Execute the transaction immediately (requires wallet keypair). If not set, outputs base58 transaction for Squads UI.')
    .setAction(async ({ eid, tokenAddr, currentAuthority, squadsAddr, signerAddr, newAuthorityAddr, execute }: TxTaskArgs) => {
        console.log(`Changing metadata update authority from ${currentAuthority} to ${newAuthorityAddr}...`)
        
        const { umi, connection, umiWalletSigner } = execute 
            ? await deriveConnection(eid, false)
            : await deriveConnection(eid, true)

        const mintPubkey = new PublicKey(tokenAddr)
        const mintAccount = await connection.getAccountInfo(mintPubkey)
        
        if (!mintAccount) {
            throw new Error(`Mint account not found: ${tokenAddr}`)
        }

        const tokenProgramType = tokenProgramAddressToType(mintAccount.owner)
        
        const isMultisig = !!squadsAddr && !!signerAddr
        const actualSignerAddr = isMultisig ? signerAddr! : currentAuthority
        
        const signerPubkey = new PublicKey(actualSignerAddr)
        const currentAuthorityPubkey = new PublicKey(currentAuthority)
        const newAuthorityPubkey = new PublicKey(newAuthorityAddr)

        let ix: any

        if (tokenProgramType === SolanaTokenProgramType.SPL) {
            const mintUmi = publicKey(tokenAddr)
            const tokenMetadata = await getSolanaTokenMetadata(umi, mintUmi, tokenProgramType)
            
            if (!tokenMetadata?.updateAuthority) {
                throw new Error('No Metaplex metadata found for this token. Cannot update metadata authority.')
            }

            const metadataPda = findMetadataPda(umi, { mint: mintUmi })

            const updateIx = updateMetadataAccountV2(umi, {
                metadata: metadataPda,
                updateAuthority: createNoopSigner(publicKey(currentAuthority)),
                newUpdateAuthority: publicKey(newAuthorityAddr),
            })

            const umiInstruction = updateIx.getInstructions()[0]
            ix = toWeb3JsInstruction(umiInstruction)

            // For multisigs, we need to modify the instruction to use the actual signer
            if (isMultisig) {
                // Find the updateAuthority key and update it to use the signer
                const updateAuthorityKeyIndex = ix.keys.findIndex(
                    (key: any) => key.pubkey.equals(currentAuthorityPubkey) && key.isSigner
                )
                
                if (updateAuthorityKeyIndex !== -1) {
                    // Update the updateAuthority key to use the signer address
                    ix.keys[updateAuthorityKeyIndex] = {
                        pubkey: signerPubkey,
                        isSigner: true,
                        isWritable: false,
                    }
                } else {
                    // If not found, add the signer as a new key
                    ix.keys.push({
                        pubkey: signerPubkey,
                        isSigner: true,
                        isWritable: false,
                    })
                }
            }
        } else {
            throw new Error(`Unsupported token program type: ${tokenProgramType}`)
        }

        if (execute) {
            const umiInstruction = fromWeb3JsInstruction(ix)
            const txBuilder = await transactionBuilder()
                .add({ instruction: umiInstruction, signers: [], bytesCreatedOnChain: 0 })
                .setLatestBlockhash(umi)

            console.log('Sending transaction...')
            const { signature } = await txBuilder.useLegacyVersion().sendAndConfirm(umi, {
                send: {
                    skipPreflight: false,
                },
            })
            const txHash = bs58.encode(signature)
            const isTestnet = eid === EndpointId.SOLANA_V2_TESTNET
            const explorerLink = getExplorerTxLink(txHash, isTestnet)
            
            console.log(`Transaction sent successfully!`)
            console.log(`Transaction signature: ${txHash}`)
            console.log(`Explorer: ${explorerLink}`)
        } else {
            await printBase58Tx(ix, umi, actualSignerAddr)
        }
    })

