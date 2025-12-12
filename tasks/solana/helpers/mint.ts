import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox'
import { publicKey } from '@metaplex-foundation/umi'
import { toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
import { TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccount, createMintToCheckedInstruction } from '@solana/spl-token'
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
    multisigAddr: string
    squadsAddr: string
    signerAddr: string
}

task('lz:solana:mint', 'Mints tokens to a user')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168) eid', undefined, devtoolsTypes.eid, false)
    .addParam('tokenAddr', 'The mint address of the token to mint', undefined, devtoolsTypes.string, false)
    .addParam('userAddr', 'The user address to mint tokens to', undefined, devtoolsTypes.string, false)
    .addParam('amount', 'The amount of tokens to mint', undefined, devtoolsTypes.string, false)
    .addParam('multisigAddr', 'The multisig address to use for the mint', undefined, devtoolsTypes.string, false)
    .addParam('squadsAddr', 'The squads address to use for the mint', undefined, devtoolsTypes.string, false)
    .addParam('signerAddr', 'The signer address to use for the tx', undefined, devtoolsTypes.string, false)
    .setAction(async ({ eid, tokenAddr, userAddr, amount, multisigAddr, squadsAddr, signerAddr }: TxTaskArgs) => {
        console.log(`Minting ${amount} tokens to ${userAddr}...`)
        const { connection, umi, umiWalletKeyPair } = await deriveConnection(eid)

        const tokenAccount = findAssociatedTokenPda(umi, {
            mint: publicKey(tokenAddr),
            owner: publicKey(userAddr),
            tokenProgramId: publicKey(TOKEN_2022_PROGRAM_ID),
        })

        const ata = tokenAccount[0]
        console.log("User's ATA: ", ata)

        const printBalance = async () => {
            const balance = await connection.getTokenAccountBalance(new PublicKey(ata))
            console.log('Balance: ', balance.value.uiAmount)
        }

        try {
            await printBalance()
        } catch (error) {
            console.error("ATA doesn't exist, creating it...")
            const createdAta = await createAssociatedTokenAccount(
                connection,
                {
                    publicKey: toWeb3JsPublicKey(umiWalletKeyPair.publicKey),
                    secretKey: umiWalletKeyPair.secretKey,
                },
                new PublicKey(tokenAddr),
                new PublicKey(userAddr),
                {
                    commitment: 'finalized',
                },
                TOKEN_2022_PROGRAM_ID
            )
            console.log('Created ATA: ', createdAta.toBase58())
            await printBalance()
        }

        const ix = createMintToCheckedInstruction(
            new PublicKey(tokenAddr), // mint
            new PublicKey(ata), // ata
            new PublicKey(multisigAddr), // mint authority $MULTISIG_ADDR
            parseUnits(amount, 6).toBigInt(),
            6,
            [new PublicKey(squadsAddr)], // $SQUADS_ADDR
            TOKEN_2022_PROGRAM_ID
        )

        await printBase58Tx(ix, umi, signerAddr)
    })
