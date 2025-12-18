import { AuthorityType, TOKEN_2022_PROGRAM_ID, createSetAuthorityInstruction } from '@solana/spl-token'
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
    currentAuthorityAddr: string
    newAuthorityAddr: string
}

task('lz:solana:set-authority', 'Transfers the authority')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168) eid', undefined, devtoolsTypes.eid, false)
    .addParam('tokenAddr', 'The mint address of the token to mint', undefined, devtoolsTypes.string, false)
    .addParam('squadsAddr', 'The squads address to use for the mint', undefined, devtoolsTypes.string, false)
    .addParam('currentAuthorityAddr', 'The current authority address', undefined, devtoolsTypes.string, false)
    .addParam('newAuthorityAddr', 'The new authority address', undefined, devtoolsTypes.string, false)
    .setAction(async ({ eid, tokenAddr, currentAuthorityAddr, newAuthorityAddr, squadsAddr }: TxTaskArgs) => {
        console.log(`Authorizing ${currentAuthorityAddr} to ${newAuthorityAddr}...`)
        const { umi } = await deriveConnection(eid)

        const ix = createSetAuthorityInstruction(
            new PublicKey(tokenAddr), // mint
            new PublicKey(currentAuthorityAddr), // current authority
            AuthorityType.PausableConfig, // authority type
            new PublicKey(newAuthorityAddr), // new authority
            [new PublicKey(squadsAddr)], // $ADMIN_SQUADS_ADDR
            TOKEN_2022_PROGRAM_ID
        )

        await printBase58Tx(ix, umi, squadsAddr)
    })
