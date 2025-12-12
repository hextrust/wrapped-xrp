import { TOKEN_2022_PROGRAM_ID, createResumeInstruction } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { task } from 'hardhat/config'

import { types as devtoolsTypes } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { deriveConnection } from '..'

import { printBase58Tx } from './utils'

interface TxTaskArgs {
    eid: EndpointId
    tokenAddr: string
    squadsAddr: string
    signerAddr: string
}

task('lz:solana:resume', 'Resumes a paused token')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168) eid', undefined, devtoolsTypes.eid, false)
    .addParam('tokenAddr', 'The mint address of the token to resume', undefined, devtoolsTypes.string, false)
    .addParam('squadsAddr', 'The squads address to use for the resume', undefined, devtoolsTypes.string, false)
    .addParam('signerAddr', 'The signer address to use for the tx', undefined, devtoolsTypes.string, false)
    .setAction(async ({ eid, tokenAddr, squadsAddr, signerAddr }: TxTaskArgs) => {
        console.log(`Resuming token ${tokenAddr}...`)

        const { umi } = await deriveConnection(eid)

        const ix = createResumeInstruction(
            new PublicKey(tokenAddr), // mint
            new PublicKey(squadsAddr), // $SQUADS_ADDR
            [new PublicKey(squadsAddr)], // $SQUADS_ADDR
            TOKEN_2022_PROGRAM_ID
        )

        await printBase58Tx(ix, umi, signerAddr)
    })
