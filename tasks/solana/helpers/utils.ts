import { Umi, createNoopSigner, publicKey, transactionBuilder } from '@metaplex-foundation/umi'
import { fromWeb3JsInstruction, toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters'
import { TransactionInstruction } from '@solana/web3.js'
import bs58 from 'bs58'

export const printBase58Tx = async (instruction: TransactionInstruction, umi: Umi, signerAddr: string) => {
    const umiInstruction = fromWeb3JsInstruction(instruction)

    const txBuilder = await transactionBuilder()
        .add({ instruction: umiInstruction, signers: [], bytesCreatedOnChain: 0 })
        .setLatestBlockhash(umi)

    const builtTx = txBuilder.useLegacyVersion().build({
        payer: createNoopSigner(publicKey(signerAddr)),
        transactions: umi.transactions,
    })

    // Convert to web3.js transaction and serialize
    const web3JsTxn = toWeb3JsTransaction(builtTx)
    const base58Tx = bs58.encode(new Uint8Array(web3JsTxn.message.serialize()))

    console.log('==== Import the following base58 txn data into the Squads UI ====')
    console.log(base58Tx)
    console.log('==== End of base58 txn data ====')
}
