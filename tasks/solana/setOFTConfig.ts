import { createNoopSigner, KeypairSigner, publicKey, transactionBuilder } from '@metaplex-foundation/umi'
import { toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters'
import bs58 from 'bs58'
import { task } from 'hardhat/config'

import { types as devtoolsTypes } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { oft } from '@layerzerolabs/oft-v2-solana-sdk'

import { TransactionType, addComputeUnitInstructions, deriveConnection, getExplorerTxLink } from './index'

interface SetOFTConfigTaskArgs {
    /**
     * The endpoint ID for the Solana network.
     */
    eid: EndpointId

    /**
     * The OFT Store public key.
     */
    oftStore: string

    /**
     * The program ID for the OFT program.
     */
    programId: string

    /**
     * The new admin public key.
     */
    newAdmin?: string

    /**
     * The new delegate public key.
     */
    newDelegate?: string

    /**
     * The new default fee in basis points.
     */
    defaultFee?: number

    /**
     * Set paused state.
     */
    paused?: boolean

    /**
     * The new pauser public key.
     */
    pauser?: string

    /**
     * The new unpauser public key.
     */
    unpauser?: string

    computeUnitPriceScaleFactor: number

    /**
     * Output transaction as base58 instead of sending it.
     */
    outputBase58?: boolean
}

task('lz:oft:solana:set-config', 'Sets OFT configuration (admin, delegate, fees, etc.)')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168)', undefined, devtoolsTypes.eid)
    .addParam('oftStore', 'The OFT Store public key')
    .addParam('programId', 'The OFT Program id')
    .addOptionalParam('newAdmin', 'The new admin public key', undefined, devtoolsTypes.string)
    .addOptionalParam('newDelegate', 'The new delegate public key', undefined, devtoolsTypes.string)
    .addOptionalParam('defaultFee', 'The new default fee in basis points', undefined, devtoolsTypes.int)
    .addOptionalParam('paused', 'Set paused state', undefined, devtoolsTypes.boolean)
    .addOptionalParam('pauser', 'The new pauser public key', undefined, devtoolsTypes.string)
    .addOptionalParam('unpauser', 'The new unpauser public key', undefined, devtoolsTypes.string)
    .addParam('computeUnitPriceScaleFactor', 'The compute unit price scale factor', 4, devtoolsTypes.float, true)
    .addFlag('outputBase58', 'Output transaction as base58 instead of sending it')
    .setAction(
        async ({
            eid,
            oftStore: oftStoreStr,
            programId: programIdStr,
            newAdmin: newAdminStr,
            newDelegate: newDelegateStr,
            defaultFee,
            paused,
            pauser: pauserStr,
            unpauser: unpauserStr,
            computeUnitPriceScaleFactor,
            outputBase58,
        }: SetOFTConfigTaskArgs) => {
            const { connection, umi, umiWalletSigner } = await deriveConnection(eid)
            const oftStore = publicKey(oftStoreStr)
            const programId = publicKey(programIdStr)

            if (
                !newAdminStr &&
                !newDelegateStr &&
                defaultFee === undefined &&
                paused === undefined &&
                !pauserStr &&
                !unpauserStr
            ) {
                throw new Error('At least one configuration parameter must be provided')
            }

            const isTestnet = eid === EndpointId.SOLANA_V2_TESTNET

            // If outputting base58, fetch the admin address from OFT store to use in instructions
            let adminSigner = umiWalletSigner
            if (outputBase58) {
                const oftStoreInfo = await oft.accounts.fetchOFTStore(umi, oftStore)
                adminSigner = createNoopSigner(publicKey(oftStoreInfo.admin))
                console.log(`Using admin address for transaction: ${oftStoreInfo.admin}`)
            }

            let txBuilder = transactionBuilder()

            if (newDelegateStr) {
                const newDelegate = publicKey(newDelegateStr)
                console.log(`Setting delegate to: ${newDelegate}`)

                txBuilder = txBuilder.add(
                    oft.setOFTConfig(
                        {
                            admin: adminSigner,
                            oftStore: oftStore,
                        },
                        { __kind: 'Delegate', delegate: newDelegate },
                        {
                            oft: programId,
                        }
                    )
                )
            }

            if (defaultFee !== undefined) {
                console.log(`Setting default fee to: ${defaultFee} basis points`)

                txBuilder = txBuilder.add(
                    oft.setOFTConfig(
                        {
                            admin: adminSigner,
                            oftStore: oftStore,
                        },
                        { __kind: 'DefaultFee', defaultFee },
                        {
                            oft: programId,
                        }
                    )
                )
            }

            if (paused !== undefined) {
                console.log(`Setting paused state to: ${paused}`)

                txBuilder = txBuilder.add(
                    oft.setOFTConfig(
                        {
                            admin: adminSigner,
                            oftStore: oftStore,
                        },
                        { __kind: 'Paused', paused },
                        {
                            oft: programId,
                        }
                    )
                )
            }

            if (pauserStr) {
                const pauser = pauserStr === 'null' ? undefined : publicKey(pauserStr)
                console.log(`Setting pauser to: ${pauser}`)

                txBuilder = txBuilder.add(
                    oft.setOFTConfig(
                        {
                            admin: adminSigner,
                            oftStore: oftStore,
                        },
                        { __kind: 'Pauser', pauser },
                        {
                            oft: programId,
                        }
                    )
                )
            }

            if (unpauserStr) {
                const unpauser = unpauserStr === 'null' ? undefined : publicKey(unpauserStr)
                console.log(`Setting unpauser to: ${unpauser}`)

                txBuilder = txBuilder.add(
                    oft.setOFTConfig(
                        {
                            admin: adminSigner,
                            oftStore: oftStore,
                        },
                        { __kind: 'Unpauser', unpauser },
                        {
                            oft: programId,
                        }
                    )
                )
            }

            // Set admin LAST to avoid authorization issues
            if (newAdminStr) {
                const newAdmin = publicKey(newAdminStr)
                console.log(`Setting admin to: ${newAdmin} (setting admin last to avoid authorization issues)`)

                txBuilder = txBuilder.add(
                    oft.setOFTConfig(
                        {
                            admin: adminSigner,
                            oftStore: oftStore,
                        },
                        { __kind: 'Admin', admin: newAdmin },
                        {
                            oft: programId,
                        }
                    )
                )
            }

            txBuilder = await addComputeUnitInstructions(
                connection,
                umi,
                eid,
                txBuilder,
                umiWalletSigner as KeypairSigner,
                computeUnitPriceScaleFactor,
                TransactionType.SetAuthority
            )

            if (outputBase58) {
                // Build transaction with noop signer for the admin (already set above)
                const builtTx = (await txBuilder
                    .useLegacyVersion()
                    .setLatestBlockhash(umi))
                    .build({
                        payer: adminSigner,
                        transactions: umi.transactions,
                    })

                // Convert to web3.js transaction and serialize
                const web3JsTxn = toWeb3JsTransaction(builtTx)
                const base58Tx = bs58.encode(new Uint8Array(web3JsTxn.message.serialize()))

                console.log('==== Import the following base58 txn data into the Squads UI ====')
                console.log(base58Tx)
                console.log('==== End of base58 txn data ====')
                console.log(`\nAdmin address (signer): ${adminSigner.publicKey}`)
            } else {
                const { signature } = await txBuilder.sendAndConfirm(umi)
                console.log(`setOFTConfigTx: ${getExplorerTxLink(bs58.encode(signature), isTestnet)}`)

                console.log('OFT configuration updated successfully!')
            }
        }
    )
