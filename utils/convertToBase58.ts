import * as fs from 'fs'
import * as path from 'path'

import bs58 from 'bs58'

interface Transaction {
    point: {
        eid: number
        address: string
    }
    data: string
    description: string
}

/**
 * Converts hex-encoded transaction data to base58 format
 * @param inputFile - Path to the input JSON file
 * @param outputFile - Optional path to the output JSON file (defaults to input file with .base58.json suffix)
 */
function convertToBase58(inputFile: string, outputFile?: string): void {
    // Read the input file
    const inputPath = path.resolve(inputFile)
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`)
    }

    const fileContent = fs.readFileSync(inputPath, 'utf-8')
    const transactions: Transaction[] = JSON.parse(fileContent)

    // Convert each transaction's data field from hex to base58
    const convertedTransactions = transactions.map((tx) => {
        // Remove '0x' prefix if present
        const hexData = tx.data.startsWith('0x') ? tx.data.slice(2) : tx.data

        // Convert hex string to Buffer, then to Uint8Array
        const buffer = Buffer.from(hexData, 'hex')
        const uint8Array = new Uint8Array(buffer)

        // Convert Uint8Array to base58
        const base58Data = bs58.encode(uint8Array)

        return {
            ...tx,
            data: base58Data,
            originalDataHex: tx.data, // Keep original for reference
        }
    })

    // Determine output file path
    const outputPath = outputFile ? path.resolve(outputFile) : inputPath.replace(/\.(json|log)$/, '.base58.json')

    // Write the converted data
    fs.writeFileSync(outputPath, JSON.stringify(convertedTransactions, null, 2), 'utf-8')

    console.log(`✓ Converted ${convertedTransactions.length} transactions`)
    console.log(`✓ Output written to: ${outputPath}`)

    // Print first transaction as example
    if (convertedTransactions.length > 0) {
        console.log('\nExample conversion:')
        console.log(`  Original (hex): ${convertedTransactions[0].originalDataHex.substring(0, 50)}...`)
        console.log(`  Converted (base58): ${convertedTransactions[0].data}`)
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.error('Usage: ts-node convertToBase58.ts <input-file> [output-file]')
        console.error('Example: ts-node convertToBase58.ts mainnet-dewire-txs.log')
        process.exit(1)
    }

    const inputFile = args[0]
    const outputFile = args[1]

    try {
        convertToBase58(inputFile, outputFile)
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
        process.exit(1)
    }
}

export { convertToBase58 }
