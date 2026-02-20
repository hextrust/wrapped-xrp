# Mainnet deployment

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
      DEPLOYER_KEYPAIR=~/deployments/wxrp/mainnet.json
      solana-keygen new -o $DEPLOYER_KEYPAIR
   ```

   Assigning `pubkey` as deployer address.

   ```bash
      DEPLOYER_ADDR=FqbEHeg8hH36M9A56wBbKu3k1PD81cKFfPD9zpzL7AoU # Lz owned
   ```

2. Set configuration for Solana CLI

   ```bash
      solana config set -k $DEPLOYER_KEYPAIR
      solana config set --url https://api.mainnet-beta.solana.com
      solana config get
      solana address
   ```

3. Generate new keypair for OFT program

   ```bash
      solana-keygen new -o target/deploy/oft-keypair.json -f
      # Note: -f overwrites any exisitng keys in that location
   ```

   Use `pubkey` as OFT_ID.

   ```bash
      OFT_ID=H5WWM7uWHbmZjThKyPbjNGvAagizKA9zzchZWwn79W99
   ```

4. Build Solana OFT (verifiable)

   ```bash
      anchor build -v -e OFT_ID=$OFT_ID
   ```

5. Deploy OFT

   ```bash
      solana program deploy --program-id target/deploy/oft-keypair.json target/verifiable/oft.so
   ```

   ```
      Program Id: H5WWM7uWHbmZjThKyPbjNGvAagizKA9zzchZWwn79W99

      Signature: nfjDsmm3VV7jNmF3nrQxtcZzFn1oX268r5HbFGUaiY2hjdaaxLHmiKixWq5pXcTbMa2MS8PDqC2MZ8nXpGo7a7Y
   ```

   https://solscan.io/account/H5WWM7uWHbmZjThKyPbjNGvAagizKA9zzchZWwn79W99


## Multisig vaults and roles

Admin: https://app.squads.so/squads/FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E/home
Ops: https://app.squads.so/squads/2WpgARMHmfvvy6sqij5KfKvQFJen7R1DwEocmuMgfjX9/home

```bash
   ADMIN_SQUADS_VAULT_ADDR=FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
   OPS_SQUADS_VAULT_ADDR=2WpgARMHmfvvy6sqij5KfKvQFJen7R1DwEocmuMgfjX9
```

```
   Admin Multisig:
   - Token and OFT program Owner and Delegate
   - Upgrade authority
   - Token metadata update authority
   - Other authorities for different extensions

   Operator Multisig:
   - Mint authority (Minting)
   - Permanent Delegate (Burning) (note, that permanent delegate can transfer tokens from any account)
   - Freeze Authority (Blacklisting)
   - Pausable Authority (Pausing)
```

## Create OFT

1. Init OFT

   ```bash
         npx hardhat lz:oft:solana:create --eid 30168 --name "Wrapped XRP" --symbol "wXRP" --local-decimals 6 --shared-decimals 6 --uri "" --seller-fee-basis-points 0 --token-metadata-is-mutable true --token-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA --program-id H5WWM7uWHbmZjThKyPbjNGvAagizKA9zzchZWwn79W99 --amount 0 --additional-minters $OPS_SQUADS_VAULT_ADDR
      # Note: Additional minters should be a squads vault address -> https://app.squads.so/squads
      # The address will be combined with oft store address to create native multisig
      # so OFT program can mint/burn tokens but also squads multisig
   ```

   ```
      createMultisigTx: https://solscan.io/tx/5sd3dZaLPXKJwnRoKFycYPY69wDXk7ndvmEvwi22mCHTDVfa1GrfEJwubuoDbHEAb5tdHxyMBA8K2MbzDJhUfcnH?cluster=mainnet-beta
      created SPL multisig @ E5GXVzJbuN7iPJAfNB23SMXgQLXWGkqRWgvsq4Dg156o
      createTokenTx: https://solscan.io/tx/qbJuF791MnLxoY1jnARYDhmrhTmiAk4DzNPseLWEa3muXcTd5rAPmtXkg8gJv6qxWQkxerWwnojokDqrDZNTL3E?cluster=mainnet-beta
      initOftTx: https://solscan.io/tx/3EuXvbstEh2ZW1Qekm4WXWTV1y1kTFB8e2v3RZ2DbqBZoKoeA3G7bQYYErseqKVbU3WTzL5jSzdsa7SXYWFLZLpC?cluster=mainnet-beta
      setAuthorityTx: https://solscan.io/tx/4ZYuHTx98aYx5QqJtjfyTjcbrdVZCWyqjEXxKyebwTa3Vmqso27hQFxxJc5MrL4dGtKX9uvULniS62VUuZRmGLw2?cluster=mainnet-beta
   ```

2. Adjust owner in `consts/mainnet.ts` to $DEPLOYER_ADDR

3. Init config (Solana specific) - one account per non-solana chain (3 chains)

   ```bash
      pnpm hardhat lz:oft:solana:init-config --oapp-config layerzero.mainnet.config.ts
   ```

4. Wire Solana outwards (to Eth, Optimism and Hyperliquid)

   ```bash
      pnpm hardhat lz:oapp:wire --oapp-config layerzero.mainnet.config.ts --skip-connections-from-eids 30101,30111,30367
   ```

   `10 txs - setPeer x3, setUln x6, setEnfOpt x1`

5. Prepare calldata to wire inwards to Solana

   ```bash
      pnpm hardhat lz:oapp:wire --oapp-config layerzero.mainnet.config.ts --signer $ADMIN_SQUADS_VAULT_ADDR --skip-connections-from-eids 30168 --output-filename mainnet-txs.log
   ```

6. Adjust owner in `consts/mainnet.ts` to $ADMIN_SQUADS_VAULT_ADDR

## Transfer ownership

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

## Verification (mainnet only)

1. Locally
   `solana-verify get-executable-hash ./target/verifiable/oft.so`

2. On chain
   `solana-verify get-program-hash $OFT_ID`

3. Verify on chain
   `solana-verify verify-from-repo -um --program-id $OFT_ID <repo url> --library-name oft -- --config env.OFT_ID=\'$OFT_ID\'`
   `solana-verify remote submit-job --program-id $OFT_ID --uploader $DEPLOYER_ADDR`

## Helpers

1. Debug

   Use any of OFT_STORE,GET_ADMIN,GET_DELEGATE,CHECKS,GET_TOKEN,GET_PEERS,RATE_LIMITS.

   ```bash
      pnpm hardhat lz:oft:solana:debug --action delegate --eid 30168
      pnpm hardhat lz:oft:solana:debug --action admin --eid 30168
      pnpm hardhat lz:oft:solana:debug --action checks --eid 30168
   ```
