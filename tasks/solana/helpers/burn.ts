import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox'
import { publicKey } from '@metaplex-foundation/umi'
import { TOKEN_2022_PROGRAM_ID, createBurnCheckedInstruction } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { parseUnits } from 'ethers/lib/utils'
import { task } from 'hardhat/config'

import { types as devtoolsTypes } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { deriveConnection } from '..'

import { printBase58Tx } from './utils'

interface TxTaskArgs {
    eid: EndpointId
    tokenAddr: string
    userAddr: string
    amount: string
    squadsAddr: string
    signerAddr: string
}

task('lz:solana:burn', 'Converts base64 Solana transaction to base58')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168) eid', undefined, devtoolsTypes.eid, false)
    .addParam('tokenAddr', 'The mint address of the token to burn', undefined, devtoolsTypes.string, false)
    .addParam('userAddr', 'The user address of the token to burn', undefined, devtoolsTypes.string, false)
    .addParam('amount', 'The amount of tokens to burn', undefined, devtoolsTypes.string, false)
    .addParam('signerAddr', 'The signer address to use for the tx', undefined, devtoolsTypes.string, false)
    .addParam('squadsAddr', 'The squads address to use for the burn', undefined, devtoolsTypes.string, false)
    .setAction(async ({ eid, tokenAddr, userAddr, amount, squadsAddr, signerAddr }: TxTaskArgs) => {
        console.log(`Burning ${amount} tokens from ${userAddr}...`)

        const { connection, umi } = await deriveConnection(eid)

        const tokenAccount = findAssociatedTokenPda(umi, {
            mint: publicKey(tokenAddr),
            owner: publicKey(userAddr),
            tokenProgramId: publicKey(TOKEN_2022_PROGRAM_ID),
        })

        const ata = tokenAccount[0]
        console.log("User's ATA: ", ata)

        const balance = await connection.getTokenAccountBalance(new PublicKey(ata))
        console.log('Balance: ', balance.value.uiAmount)

        if (!balance.value.uiAmount || balance.value.uiAmount < parseFloat(amount)) {
            throw new Error('Insufficient balance')
        }

        const ix = createBurnCheckedInstruction(
            new PublicKey(ata), // ata
            new PublicKey(tokenAddr), // mint
            new PublicKey(squadsAddr), // owner  // $SQUADS_ADDR
            parseUnits(amount, 6).toBigInt(),
            6,
            [new PublicKey(squadsAddr)], // $SQUADS_ADDR
            TOKEN_2022_PROGRAM_ID
        )

        await printBase58Tx(ix, umi, signerAddr)
    })
