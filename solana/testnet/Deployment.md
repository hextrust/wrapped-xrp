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
      DEPLOYER_ADDR=7XeCYeAzpFxByBa3fBLe8NZdqXp8kc7JANGv5fNTkhpE # Lz owned
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
      OFT_ID=EkEGtZPFH1Abv3iwNfEyh3HmQ2D1ghVfN2DssXmSoTkN
   ```

4. Build Solana OFT (verifiable)

   ```bash
      anchor build -v -e OFT_ID=$OFT_ID
   ```

5. Deploy OFT

   ```bash
      solana program deploy --program-id target/deploy/oft-keypair.json target/verifiable/oft.so
   ```

6. Generate token keypair with WXRP prefix.

   ```bash
      solana-keygen grind --starts-with wxrp:1
   ```

   Assing `pubkey` as token address.

   ```bash
      TOKEN_ADDR=wxrpANtqnkD1b9Ux8KSVX2ZRChkkmpiKf2Vj5qo4WQ9
   ```

7. Deploy Spl token2022 with friendly address

   ```bash
      spl-token --program-2022 create-token --decimals 6 --enable-metadata --enable-freeze --enable-pause --enable-permanent-delegate --ui-amount-multiplier 1 --default-account-state initialized --enable-close --enable-confidential-transfers manual --transfer-fee-basis-points 0 --transfer-hook $TOKEN_ADDR --transfer-fee-maximum-fee 0 $TOKEN_ADDR.json
   ```

   Disable webhook

   ```bash
      spl-token --program-2022 set-transfer-hook $TOKEN_ADDR --disable
   ```

   ```bash
      spl-token initialize-metadata $TOKEN_ADDR "Wrapped XRP" "WXRP" "www.hextrust.com"
   ```

8. Create ATA and mint some (optional)

   ```bash
      spl-token create-account $TOKEN_ADDR
      spl-token accounts --owner $DEPLOYER_ADDR
      spl-token mint $TOKEN_ADDR 100 --recipient-owner $DEPLOYER_ADDR
      spl-token balance $TOKEN_ADDR
   ```

## Create OFT

1. Init OFT

   ```bash
         SQUADS_VAULT_ADDR=Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
         SOLANA_KEYPAIR_PATH=$DEPLOYER_KEYPAIR
         pnpm hardhat lz:oft:solana:create --eid 40168 --name "Wrapped XRP" --symbol "WXRP" --local-decimals 6 --shared-decimals 6 --uri "www.hextrust.com" --seller-fee-basis-points 0 --token-metadata-is-mutable true --token-program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --program-id $OFT_ID --mint $TOKEN_ADDR --amount 0 --additional-minters $SQUADS_VAULT_ADDR
      # Note: Additional minters should be a squads vault address -> https://app.squads.so/squads
      # The address will be combined with oft store address to create native multisig
      # so OFT program can mint/burn tokens but also squads multisig
   ```

   ```
      createMultisigTx: https://solscan.io/tx/3spb2bK3yezp4msciuYDKbfrRiuZQj6Z3vMSRpGPpzMuWfzB3EjByjFtVr7Gz94GnoSo6Q2nnoeBj1ScReXCh8YN?cluster=devnet
      created SPL multisig @ ByB7kbz989r7Wq1E9d7GKrodfqhtuUePBQ77BtuxZq1t
      initOftTx: https://solscan.io/tx/2iBYegAyKXGmYBY8HHdvnLs1xykDJj3dn9ztJkuztf4cfBbxH2LPu1PyU6FHHVGua2onUtGhL9BQE1PVhENEENyj?cluster=devnet
   ```

   Assign multisig addr (for mint authority only)

   ```bash
      MULTISIG_ADDR=ByB7kbz989r7Wq1E9d7GKrodfqhtuUePBQ77BtuxZq1t
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

1. Transfer token mint authority to multisig

   ```bash
      spl-token authorize $TOKEN_ADDR mint $MULTISIG_ADDR
   ```

2. Update remaining ones for token - freeze/pause/close-mint/transfer-fee-config/withheld-withdraw/confidential-transfer-mint/confidential-transfer-fee/transfer-hook-program-id/metadata/metadata-pointer/scaled-ui-amount authorities and permanent-delegate

   ```bash
      spl-token authorize $TOKEN_ADDR freeze $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR pause $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR close-mint $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR transfer-fee-config $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR withheld-withdraw $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR confidential-transfer-mint $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR confidential-transfer-fee $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR transfer-hook-program-id $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR metadata $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR metadata-pointer $SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR scaled-ui-amount $SQUADS_VAULT_ADDR

      spl-token authorize $TOKEN_ADDR permanent-delegate $SQUADS_VAULT_ADDR

      spl-token display $TOKEN_ADDR
   ```

Expected result -> All authorities should be set to $SQUADS_VAULT_ADDR, but the mint authority to $MULTISIG_ADDR

```
   SPL Token Mint
   Address: wxrpANtqnkD1b9Ux8KSVX2ZRChkkmpiKf2Vj5qo4WQ9
   Program: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
   Supply: 0
   Decimals: 6
   Mint authority: ByB7kbz989r7Wq1E9d7GKrodfqhtuUePBQ77BtuxZq1t
   Freeze authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Extensions
   Close authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Permanent delegate: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Default state: Initialized
   Transfer fees:
   Current fee: 0bps
   Current maximum: 0
   Config authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Withdrawal authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Withheld fees: 0
   Confidential transfer:
   Authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Account approve policy: manual
   Audit key: audits are disabled
   Confidential transfer fee:
   Authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Withdraw Withheld Encryption key: WM80P4nNYlxjB5lGZGg+npIcCzzcbPQkoVoLmYZVwj8=
   Harvest to mint: Enabled
   Withheld Amount: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==
   Transfer Hook:
   Authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Program Id: Disabled
   Metadata Pointer:
   Authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Metadata address: wxrpANtqnkD1b9Ux8KSVX2ZRChkkmpiKf2Vj5qo4WQ9
   Metadata:
   Update Authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   Mint: wxrpANtqnkD1b9Ux8KSVX2ZRChkkmpiKf2Vj5qo4WQ9
   Name: Wrapped XRP
   Symbol: WXRP
   URI: www.hextrust.com
```

3. Update OFT program upgrade authority

   ```bash
      solana program set-upgrade-authority $OFT_ID --new-upgrade-authority $SQUADS_VAULT_ADDR --skip-new-upgrade-authority-signer-check
      solana program show $OFT_ID
   ```

   ```
      Account Type: Program
      Authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob


      Program Id: EkEGtZPFH1Abv3iwNfEyh3HmQ2D1ghVfN2DssXmSoTkN
      Owner: BPFLoaderUpgradeab1e11111111111111111111111
      ProgramData Address: J9kWtiHPEA2uwhAL9reJfVTYWCLfEMXF6BEbJBYfr4dd
      Authority: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
      Last Deployed In Slot: 426078257
      Data Length: 571200 (0x8b740) bytes
      Balance: 3.97675608 SOL
   ```

4. Transfer pauser/unpauser and admin/delegate

   From `deployments/solana-testnet/OFT.json`

   ```bash
      OFT_STORE=44F6EuNhHYmt7JRXvjzw5vJjGogdeVHRw1BQBEQ9NxBT
      pnpm hardhat lz:oft:solana:set-config --eid 40168 --oft-store $OFT_STORE --program-id $OFT_ID --pauser $SQUADS_VAULT_ADDR
      pnpm hardhat lz:oft:solana:set-config --eid 40168 --oft-store $OFT_STORE --program-id $OFT_ID --unpauser $SQUADS_VAULT_ADDR
      pnpm hardhat lz:oft:solana:set-config --eid 40168 --oft-store $OFT_STORE --program-id $OFT_ID --new-delegate $SQUADS_VAULT_ADDR
      pnpm hardhat lz:oft:solana:set-config --eid 40168 --oft-store $OFT_STORE --program-id $OFT_ID --new-admin $SQUADS_VAULT_ADDR
   ```

   ```bash
      pnpm hardhat lz:oft:solana:debug --action delegate --eid 40168
      pnpm hardhat lz:oft:solana:debug --action admin --eid 40168
   ```

   ```
      Delegate: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
      Admin: Hy6h65XTsDkR6DBcGjr33WTpCJpM9dyLywYyu81vPKob
   ```

# Test

1. Send Solana to Eth

   ```bash
      pnpm hardhat lz:oft:send --src-eid 40168 --dst-eid 40161 --to <EVM_ADDR> --amount 2 --token-program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
   ```

2. And back

   ```bash
      pnpm hardhat lz:oft:send --src-eid 40161 --dst-eid 40168 --to $DEPLOYER_ADDR --oft-address <EVM_OFT_ADDR> --amount 1
   ```

   (Sepolia - 40161, Solana - 40168, Hyperliquid testnet - 40362)

## Verification (mainnet only)

1. Locally
   `solana-verify get-executable-hash ./target/verifiable/oft.so`

2. On chain
   `solana-verify get-program-hash $OFT_ID`

3. Verify on chain
   `solana-verify verify-from-repo  -um --program-id $OFT_ID <repo url> --library-name oft -- --config env.OFT_ID=\'$OFT_ID\'`
   `solana-verify remote submit-job --program-id $OFT_ID --uploader $DEPLOYER_ADDR`

## Helpers

1. Find ATA

   `spl-token --program-2022 address --token $TOKEN_ADDR --owner $DEPLOYER_ADDR --verbose`

2. Debug

   Use any of OFT_STORE,GET_ADMIN,GET_DELEGATE,CHECKS,GET_TOKEN,GET_PEERS,RATE_LIMITS.

   ```bash
      pnpm hardhat lz:oft:solana:debug --action delegate --eid 40168
      pnpm hardhat lz:oft:solana:debug --action admin --eid 40168
      pnpm hardhat lz:oft:solana:debug --action checks --eid 40168
   ```

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
