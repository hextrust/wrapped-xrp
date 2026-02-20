# Testnet deployment

Note: On Solana the devnet is default network for testing.
We'll use only devnet in all scenarios.
The testnet is used for stress tests.

## Requirements

Ofts are deployed and wired on Ethereum and Hyperliquid

### Versions checks:

```bash
   anchor -V && solana -V && rustc -V && spl-token -V
```

```
   anchor-cli 0.32.1
   solana-cli 2.3.0 (src:a2e21dda; feat:3640012085, client:Agave)
   rustc 1.90.0-nightly (35f603652 2025-06-29)
   spl-token-cli 5.3.0
```

(agave-install for solana versions)

## Deploy

1. Generate new keypair for deployer

   ```bash
      DEPLOYER_KEYPAIR=~/deployments/wxrp/testnet.json
      solana-keygen new -o $DEPLOYER_KEYPAIR
   ```

   Assigning `pubkey` as deployer address.

   ```bash
      DEPLOYER_ADDR=HJagyGRc3w4TxdaidAWjA6tjSbxj8UHeJpytdtGimJ6a # Lz owned
   ```

2. Set configuration for Solana CLI

   ```bash
      solana config set -k $DEPLOYER_KEYPAIR
      solana config set --url https://api.devnet.solana.com
      solana config get
   ```

3. Generate new keypair for OFT program

   ```bash
      solana-keygen new -o target/deploy/oft-keypair.json -f
      # Note: -f overwrites any exisitng keys in that location
   ```

   Use `pubkey` as OFT_ID.

   ```bash
      OFT_ID=ANBPMYzXfRt5xwwGDzakyjHCeCr2jkLJrN5E8z8vSspD
   ```

4. Build Solana OFT (verifiable)

   ```bash
      anchor build -v -e OFT_ID=$OFT_ID
   ```

5. Deploy OFT

   ```bash
      solana program deploy --program-id target/deploy/oft-keypair.json target/verifiable/oft.so
   ```

## Create OFT

1. Init OFT

   ```bash
         SQUADS_VAULT_ADDR=Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
         SOLANA_KEYPAIR_PATH=$DEPLOYER_KEYPAIR
         npx hardhat lz:oft:solana:create --eid 40168 --name "Wrapped XRP" --symbol "WXRP" --local-decimals 6 --shared-decimals 6 --uri "www.hextrust.com" --seller-fee-basis-points 0 --token-metadata-is-mutable true --token-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA --program-id $OFT_ID --amount 10000000 --additional-minters $SQUADS_VAULT_ADDR
      # Note: Additional minters should be a squads vault address -> https://app.squads.so/squads
      # The address will be combined with oft store address to create native multisig
      # so OFT program can mint/burn tokens but also squads multisig
   ```

   ```
      createMultisigTx: https://solscan.io/tx/2qdBj5k4Ddvusq7Qv7QfGVeVfCk9AA16vfj37qriUWZjL9c9ZMYsUKM3kHPSZpADzTi6xK59LP2hLMcHmdYrBu4G?cluster=devnet
      created SPL multisig @ 8vWTyXD3rVza9Fvr5oN7QuhASGEyMYi6Dzj7pZGRXCCG
      createTokenTx: https://solscan.io/tx/5aiTCUrM5hp5LbvKWiir9xaAPMf5s58V4q9KKZB94x8sZN9DmQ74eHjYjQRJSr1VDLfejPuotd1hrrWhNe4r5BL8?cluster=devnet
      initOftTx: https://solscan.io/tx/2FQdLyugpapgdTqgGepryUfxqZLhZSmrrxnWjiLJiAvt4s6aZida1ATDD3UNF5ESb8nyWAzmryQPRsc63qMTHDtc?cluster=devnet
   ```

2. Init config (Solana specific) - one account per non-solana chain

   ```bash
      pnpm hardhat lz:oft:solana:init-config --oapp-config layerzero.testnet.config.ts
   ```

3. Adjust owner in `consts/testnet.ts` to $DEPLOYER_ADDR

4. Wire Solana outwards (to Sepolia and Hyperliquid)

   ```bash
      pnpm hardhat lz:oapp:wire --oapp-config layerzero.testnet.config.ts --skip-connections-from-eids 40161,40362
   ```

5. Prepare calldata to wire inwards to Solana

   ```bash
      pnpm hardhat lz:oapp:wire --oapp-config layerzero.testnet.config.ts --signer $SQUADS_VAULT_ADDR --skip-connections-from-eids 40168 --output-filename testnet-txs.log
   ```

6. Adjust owner in `consts/testnet.ts` to $SQUADS_VAULT_ADDR

## Transfer ownership
TODO once wired
1. Transfer delegate and ownership for solana OFT 

pnpm hardhat lz:oapp:wire --oapp-config layerzero.mainnet.config.ts --skip-connections-from-eids 30101,30111,30367

npx hardhat lz:ownable:transfer-ownership --oapp-config layerzero.mainnet.config.ts

2. Update OFT program upgrade authority

   ```bash
      solana program set-upgrade-authority $OFT_ID --new-upgrade-authority $ADMIN_SQUADS_VAULT_ADDR --skip-new-upgrade-authority-signer-check -um
      solana program show $OFT_ID
   ```

   ```
      Account Type: Program
      Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E


      Program Id: H5WWM7uWHbmZjThKyPbjNGvAagizKA9zzchZWwn79W99
      Owner: BPFLoaderUpgradeab1e11111111111111111111111
      ProgramData Address: 2wnZELFtb6Aw2VQTU3CMN4pKAcx5RQdj26m99ui3gkec
      Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Last Deployed In Slot: 386914855
      Data Length: 571200 (0x8b740) bytes
      Balance: 3.97675608 SOL
   ```

3. Transfer pauser/unpauser and admin/delegate

   From `deployments/solana-mainnet/OFT.json`

   ```bash
      OFT_STORE=FwF2zxV5MaFZfq3pgfcgzJqKWBRyYsiVNVEXqxgshKaH
      pnpm hardhat lz:oft:solana:set-config --eid 30168 --oft-store $OFT_STORE --program-id $OFT_ID --pauser $ADMIN_SQUADS_VAULT_ADDR
      pnpm hardhat lz:oft:solana:set-config --eid 30168 --oft-store $OFT_STORE --program-id $OFT_ID --unpauser $ADMIN_SQUADS_VAULT_ADDR
      pnpm hardhat lz:oft:solana:set-config --eid 30168 --oft-store $OFT_STORE --program-id $OFT_ID --new-delegate $ADMIN_SQUADS_VAULT_ADDR
      pnpm hardhat lz:oft:solana:set-config --eid 30168 --oft-store $OFT_STORE --program-id $OFT_ID --new-admin $ADMIN_SQUADS_VAULT_ADDR
   ```

   ```bash
      pnpm hardhat lz:oft:solana:debug --action delegate --eid 30168
      pnpm hardhat lz:oft:solana:debug --action admin --eid 30168
   ```

   ```
      Delegate: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Admin: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
   ```

# Test

1. Send Solana to Eth

   ```bash
      pnpm hardhat lz:oft:send --src-eid 30168 --dst-eid 30101 --to <EVM_ADDR> --amount 2 --token-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
   ```

2. And back

   ```bash
      pnpm hardhat lz:oft:send --src-eid 30101 --dst-eid 30168 --to $DEPLOYER_ADDR --oft-address <EVM_OFT_ADDR> --amount 1
   ```

   (Eth - 30101, Solana - 30168, Hyperliquid - 30367, Optimism - 30111)


## Create Squads multisig (testnet only)

On mainnet it costs ~0.10-0.15 SOL and can be done via interface.

Docs: https://docs.squads.so/main/development/cli/commands#multisig-create
Permissions list: https://docs.squads.so/main/development/reference/permissions

```bash
   squads-multisig-cli multisig-create --rpc-url https://api.devnet.solana.com --keypair $DEPLOYER_KEYPAIR --threshold 1 --members "$DEPLOYER_ADDR,7"  --members "B2edFYj5sC4GV4FbHKSJnFfMVWmEgP96u3pLxxJbkjXy,7" --members "8jZviur8nvByf7uypy13SAT22FeeVmeenpzK5tQE8oKm,7"
```

```
   ✅ Created Multisig: GcXaQZmVmBkFKuKNCzbYeoXs9Vc1VZ3za1zxdtjXFdR5. Signature: 3MBxTQEu2X4qA5UjfpY4TiWJP3BLhhPVJf7wncZnh1ojUM5Vea4YbvBKECWQL8CjcC2WV4rG2i2HG8eamxht9arU
```

Get the index 0 vault from https://backup.app.squads.so and assign to `SQUADS_VAULT_ADDR=Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob`.
