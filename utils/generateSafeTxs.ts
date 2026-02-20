import * as fs from 'fs'
import * as path from 'path'

import { getOwnerAddress } from '../consts/mainnet'

interface Transaction {
    point: {
        eid: number
        address: string
    }
    data: string
    description: string
}

interface SafeTransaction {
    to: string
    value: string
    data: string
    operation: number
}

interface SafeTransactionBuilder {
    version: string
    chainId: string
    createdAt: number
    meta: {
        name: string
        description: string
        txBuilderVersion: string
        createdFromSafeAddress: string
    }
    transactions: SafeTransaction[]
}

// Mapping from EID to chainId and network name
const EID_TO_CHAIN_CONFIG: Record<number, { chainId: string; networkName: string }> = {
    30101: { chainId: '1', networkName: 'ethereum-mainnet' },
    30367: { chainId: '999', networkName: 'hyperevm-mainnet' },
    30111: { chainId: '10', networkName: 'optimism-mainnet' },
}

const TX_BUILDER_VERSION = '1.17.1'

/**
 * Generates Safe transaction builder compatible JSON files for each EID
 * @param inputFile - Path to the input JSON log file
 * @param outputDir - Directory to write output files (defaults to tx-data directory)
 */
function generateSafeTxs(inputFile: string, outputDir?: string): void {
    // Read the input file
    const inputPath = path.resolve(inputFile)
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`)
    }

    const fileContent = fs.readFileSync(inputPath, 'utf-8')
    const transactions: Transaction[] = JSON.parse(fileContent)

    // Determine output directory
    const defaultOutputDir = path.resolve(path.dirname(inputPath))
    const outputDirectory = outputDir ? path.resolve(outputDir) : defaultOutputDir

    // Group transactions by EID
    const transactionsByEid: Record<number, Transaction[]> = {}
    for (const tx of transactions) {
        const eid = tx.point.eid
        if (!transactionsByEid[eid]) {
            transactionsByEid[eid] = []
        }
        transactionsByEid[eid].push(tx)
    }

    // Generate a Safe transaction builder file for each EID
    for (const [eidStr, txs] of Object.entries(transactionsByEid)) {
        const eid = parseInt(eidStr, 10)
        const config = EID_TO_CHAIN_CONFIG[eid]

        if (!config) {
            console.warn(`⚠️  No chain configuration found for EID ${eid}, skipping...`)
            continue
        }

        // Convert transactions to Safe transaction format
        const safeTransactions: SafeTransaction[] = txs.map((tx) => ({
            to: tx.point.address,
            value: '0',
            data: tx.data,
            operation: 0,
        }))

        // Get the owner address for this EID
        const safeAddress = getOwnerAddress(eid)

        // Create Safe transaction builder JSON
        const safeTxBuilder: SafeTransactionBuilder = {
            version: '1.0',
            chainId: config.chainId,
            createdAt: Date.now(),
            meta: {
                name: `LayerZero Wire Configuration - ${config.networkName}`,
                description: `Transaction for LayerZero OApp wiring on ${config.networkName}`,
                txBuilderVersion: TX_BUILDER_VERSION,
                createdFromSafeAddress: safeAddress,
            },
            transactions: safeTransactions,
        }

        // Write output file
        const outputFileName = `${config.networkName}-txs.json`
        const outputPath = path.join(outputDirectory, outputFileName)
        fs.writeFileSync(outputPath, JSON.stringify(safeTxBuilder, null, 2), 'utf-8')

        console.log(`✓ Generated ${outputFileName} for EID ${eid} (${config.networkName})`)
        console.log(`  - Chain ID: ${config.chainId}`)
        console.log(`  - Transactions: ${safeTransactions.length}`)
    }

    console.log(`\n✓ Generated ${Object.keys(transactionsByEid).length} Safe transaction builder file(s)`)
    console.log(`✓ Output directory: ${outputDirectory}`)
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.error('Usage: ts-node generateSafeTxs.ts <input-file> [output-dir]')
        console.error('Example: ts-node generateSafeTxs.ts tx-data/all-evm-mainnet-txs.log')
        process.exit(1)
    }

    const inputFile = args[0]
    const outputDir = args[1]

    try {
        generateSafeTxs(inputFile, outputDir)
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
        process.exit(1)
    }
}

export { generateSafeTxs }
