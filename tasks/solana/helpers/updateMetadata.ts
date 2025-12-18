import { TOKEN_2022_PROGRAM_ID, createUpdateFieldInstruction } from '@solana/spl-token'
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
        const { umi } = await deriveConnection(eid)

        const ix = createUpdateFieldInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: new PublicKey(tokenAddr),
            updateAuthority: new PublicKey(squadsAddr),
            field,
            value,
        })

        await printBase58Tx(ix, umi, squadsAddr)
    })
