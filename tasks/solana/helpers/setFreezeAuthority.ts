import { AuthorityType, TOKEN_PROGRAM_ID, createSetAuthorityInstruction } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { task } from 'hardhat/config'

import { types as devtoolsTypes } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { deriveConnection } from '..'

import { printBase58Tx } from './utils'

interface TxTaskArgs {
    eid: EndpointId
    tokenAddr: string
    multisigAddr: string
    squadsAddr: string
    signerAddr: string
    newAuthorityAddr: string | null
    tokenProgram?: string
}

task('lz:solana:set-freeze-authority', 'Changes the freeze authority of a token')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168) eid', undefined, devtoolsTypes.eid, false)
    .addParam('tokenAddr', 'The mint address of the token', undefined, devtoolsTypes.string, false)
    .addParam('multisigAddr', 'The current freeze authority multisig address', undefined, devtoolsTypes.string, false)
    .addParam('squadsAddr', 'The squads vault address that is a signer of the multisig', undefined, devtoolsTypes.string, false)
    .addParam('signerAddr', 'The signer address to use for the tx (usually same as squadsAddr)', undefined, devtoolsTypes.string, false)
    .addParam('newAuthorityAddr', 'The new freeze authority address (or "null" to remove freeze authority)', undefined, devtoolsTypes.string, false)
    .addOptionalParam('tokenProgram', 'Token program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA (standard) or TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb (2022)', TOKEN_PROGRAM_ID.toBase58(), devtoolsTypes.string, false)
    .setAction(async ({ eid, tokenAddr, multisigAddr, squadsAddr, signerAddr, newAuthorityAddr, tokenProgram }: TxTaskArgs) => {
        console.log(`Changing freeze authority from ${multisigAddr} to ${newAuthorityAddr === 'null' ? 'null (removing)' : newAuthorityAddr}...`)
        const { umi } = await deriveConnection(eid)

        const newAuthority = newAuthorityAddr === 'null' || !newAuthorityAddr 
            ? null 
            : new PublicKey(newAuthorityAddr)

        const ix = createSetAuthorityInstruction(
            new PublicKey(tokenAddr),
            new PublicKey(multisigAddr), // current freeze authority (SPL multisig)
            AuthorityType.FreezeAccount,
            newAuthority, // new freeze authority (null to remove)
            [new PublicKey(squadsAddr)], // signer(s) - must be a signer of the multisig
            TOKEN_PROGRAM_ID
        )

        await printBase58Tx(ix, umi, signerAddr)
    })

