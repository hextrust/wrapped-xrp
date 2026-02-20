import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox'
import { publicKey } from '@metaplex-foundation/umi'
import { TOKEN_PROGRAM_ID, createThawAccountInstruction } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { task } from 'hardhat/config'

import { types as devtoolsTypes } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { deriveConnection } from '..'

import { printBase58Tx } from './utils'

interface TxTaskArgs {
    eid: EndpointId
    tokenAddr: string
    userAddr: string
    multisigAddr: string
    signerAddr: string
}

task('lz:solana:unblacklist', 'Unblacklists a user from the token')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168) eid', undefined, devtoolsTypes.eid, false)
    .addParam('tokenAddr', 'The mint address of the token to unblacklist', undefined, devtoolsTypes.string, false)
    .addParam('userAddr', 'The user address to unblacklist', undefined, devtoolsTypes.string, false)
    .addParam('multisigAddr', 'The native SPL token multisig address that is the freeze authority', undefined, devtoolsTypes.string, false)
    .addParam('signerAddr', 'The Squads Vault signer address (must be a signer of the multisig)', undefined, devtoolsTypes.string, false)
    .setAction(async ({ eid, tokenAddr, userAddr, multisigAddr, signerAddr }: TxTaskArgs) => {
        console.log(`Unblacklisting ${userAddr}...`)

        const { connection, umi } = await deriveConnection(eid)

        const tokenAccount = findAssociatedTokenPda(umi, {
            mint: publicKey(tokenAddr),
            owner: publicKey(userAddr),
            tokenProgramId: publicKey(TOKEN_PROGRAM_ID),
        })

        const ata = tokenAccount[0]
        console.log("User's ATA: ", ata)

        const balance = await connection.getTokenAccountBalance(new PublicKey(ata))
        console.log('Balance: ', balance.value.uiAmount)

        const multisigAuthorityPubkey = new PublicKey(multisigAddr) // The native SPL token multisig
        const squadsVaultSigner = new PublicKey(signerAddr) // The Squads Vault signer
        const ataPubkey = new PublicKey(ata)
        const mintPubkey = new PublicKey(tokenAddr)

        const ix = createThawAccountInstruction(
            ataPubkey,
            mintPubkey,
            multisigAuthorityPubkey,
            [squadsVaultSigner],
            TOKEN_PROGRAM_ID
        )

        const multisigKeyIndex = ix.keys.findIndex(
            (key: any) => key.pubkey.equals(multisigAuthorityPubkey)
        )
        
        if (multisigKeyIndex !== -1) {
            ix.keys[multisigKeyIndex].isSigner = false
            ix.keys[multisigKeyIndex].isWritable = false
        }

        const signerKeyIndex = ix.keys.findIndex(
            (key: any) => key.pubkey.equals(squadsVaultSigner)
        )
        
        if (signerKeyIndex !== -1) {
            ix.keys[signerKeyIndex].isSigner = true
            ix.keys[signerKeyIndex].isWritable = false
        }

        await printBase58Tx(ix, umi, signerAddr)
    })
