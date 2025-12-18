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
      DEPLOYER_ADDR=E1LSQ86sxrmkjBthCR8PKpiKrq5YFLxr41VbSZ2XKSJD # Lz owned
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
      OFT_ID=EEREQJFAhfsTCxHgX9A13W7ZJ6eVWRwkTqZ1m6Pwh2WD
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
      Program Id: EEREQJFAhfsTCxHgX9A13W7ZJ6eVWRwkTqZ1m6Pwh2WD

      Signature: 3WwXS76SBqzsjC5tGfWBqoeoBrb7aPBgibDngYuXKie8iCyFHkgSgCf6r1VUVv8bYMp6BAZK5NnAAivfRG9QLkpp
   ```

   https://solscan.io/account/EEREQJFAhfsTCxHgX9A13W7ZJ6eVWRwkTqZ1m6Pwh2WD

6. Generate token keypair with WXRP prefix.

   ```bash
      solana-keygen grind --starts-with WXRP:1
   ```

   Assing `pubkey` as token address.

   ```bash
      TOKEN_ADDR=WXRPpJt44kNmiQK495uuxPkDPHa4js4K1cyDEWXCNKY
   ```

7. Deploy Spl token2022 with friendly address

   ```bash
      spl-token --program-2022 create-token --decimals 6 --enable-metadata --enable-freeze --enable-pause --enable-permanent-delegate --ui-amount-multiplier 1 --default-account-state initialized --enable-close --enable-confidential-transfers manual --transfer-fee-basis-points 0 --transfer-hook $TOKEN_ADDR --transfer-fee-maximum-fee 0 $TOKEN_ADDR.json
   ```

   ```
      Address:  WXRPpJt44kNmiQK495uuxPkDPHa4js4K1cyDEWXCNKY
      Decimals:  6

      Signature: 3oPXFVK2X3LMd4BPqdF8GFLC7QCLxsXANzRU3m257NUYzEL75jvwjjZ8RGb7iaTJiGewLJ5Dd3kxd3Svhr8XLV83
   ```

   https://solscan.io/token/WXRPpJt44kNmiQK495uuxPkDPHa4js4K1cyDEWXCNKY

   Disable webhook

   ```bash
      spl-token --program-2022 set-transfer-hook $TOKEN_ADDR --disable
   ```

   ```bash
      spl-token initialize-metadata $TOKEN_ADDR "Wrapped XRP" "wXRP" ""
   ```

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
         SOLANA_KEYPAIR_PATH=$DEPLOYER_KEYPAIR
         pnpm hardhat lz:oft:solana:create --eid 30168 --name "Wrapped XRP" --symbol "wXRP" --local-decimals 6 --shared-decimals 6 --seller-fee-basis-points 0 --token-metadata-is-mutable true --token-program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --program-id $OFT_ID --mint $TOKEN_ADDR --amount 0 --additional-minters $OPS_SQUADS_VAULT_ADDR
      # Note: Additional minters should be a squads vault address -> https://app.squads.so/squads
      # The address will be combined with oft store address to create native multisig
      # so OFT program can mint/burn tokens but also squads multisig
   ```

   ```
      createMultisigTx: https://solscan.io/tx/4oJpDduLtUAHS61Yc3b8P51Jbi6kwFanM1FdYrnv6XKfJHoFmiK41Qa5XHWp8jbUXoXoTa7Gw5b1aLKpvfoQCp7p?cluster=mainnet-beta
      created SPL multisig @ pq3XcYiEvtUibZPzY4qMiHGyCtZPrDxDf7pYHJ3Nt3k
      initOftTx: https://solscan.io/tx/341yXF7MFTEfERibnA5tePXshubmiBRMZeTz6zrH8DqYeoYs4pjRnrGAPkPfaeK2xvcmsm1iV3qraRXB17CCbiJ6?cluster=mainnet-beta
   ```

   Assign multisig addr (for mint authority only)

   ```bash
      MULTISIG_ADDR=pq3XcYiEvtUibZPzY4qMiHGyCtZPrDxDf7pYHJ3Nt3k
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

1. Transfer token mint authority to multisig

   ```bash
      spl-token authorize $TOKEN_ADDR mint $MULTISIG_ADDR
   ```

2. Update remaining ones for token - freeze/pause/close-mint/transfer-fee-config/withheld-withdraw/confidential-transfer-mint/confidential-transfer-fee/transfer-hook-program-id/metadata/metadata-pointer/scaled-ui-amount authorities and permanent-delegate

   ```bash
      spl-token authorize $TOKEN_ADDR freeze $OPS_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR pause $OPS_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR close-mint $ADMIN_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR transfer-fee-config $ADMIN_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR withheld-withdraw $ADMIN_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR confidential-transfer-mint $ADMIN_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR confidential-transfer-fee $ADMIN_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR transfer-hook-program-id $ADMIN_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR metadata $ADMIN_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR metadata-pointer $ADMIN_SQUADS_VAULT_ADDR
      spl-token authorize $TOKEN_ADDR scaled-ui-amount $ADMIN_SQUADS_VAULT_ADDR

      spl-token authorize $TOKEN_ADDR permanent-delegate $OPS_SQUADS_VAULT_ADDR

      spl-token display $TOKEN_ADDR
   ```

```
   SPL Token Mint
      Address: WXRPpJt44kNmiQK495uuxPkDPHa4js4K1cyDEWXCNKY
      Program: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
      Supply: 0
      Decimals: 6
      Mint authority: pq3XcYiEvtUibZPzY4qMiHGyCtZPrDxDf7pYHJ3Nt3k
      Freeze authority: 2WpgARMHmfvvy6sqij5KfKvQFJen7R1DwEocmuMgfjX9
   Extensions
   Close authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
   Permanent delegate: 2WpgARMHmfvvy6sqij5KfKvQFJen7R1DwEocmuMgfjX9
   Default state: Initialized
   Transfer fees:
      Current fee: 0bps
      Current maximum: 0
      Config authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Withdrawal authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Withheld fees: 0
   Confidential transfer:
      Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Account approve policy: manual
      Audit key: audits are disabled
   Confidential transfer fee:
      Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Withdraw Withheld Encryption key: mvm8eB8SkfppIW0eDPD9KK02UyqMS10ArXY5H9zwch0=
      Harvest to mint: Enabled
      Withheld Amount: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==
   Transfer Hook:
      Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Program Id: Disabled
   Metadata Pointer:
      Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Metadata address: WXRPpJt44kNmiQK495uuxPkDPHa4js4K1cyDEWXCNKY
   Metadata:
      Update Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Mint: WXRPpJt44kNmiQK495uuxPkDPHa4js4K1cyDEWXCNKY
      Name: Wrapped XRP
      Symbol: wXRP
      URI: (not set)
```

3. Update OFT program upgrade authority

   ```bash
      solana program set-upgrade-authority $OFT_ID --new-upgrade-authority $ADMIN_SQUADS_VAULT_ADDR --skip-new-upgrade-authority-signer-check
      solana program show $OFT_ID
   ```

   ```
      Account Type: Program
      Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E


      Program Id: EEREQJFAhfsTCxHgX9A13W7ZJ6eVWRwkTqZ1m6Pwh2WD
      Owner: BPFLoaderUpgradeab1e11111111111111111111111
      ProgramData Address: 2wnZELFtb6Aw2VQTU3CMN4pKAcx5RQdj26m99ui3gkec
      Authority: FPg2KxupxTMNFk4PwBXBVF2PSvVfKyL9QBWi21huA47E
      Last Deployed In Slot: 386914855
      Data Length: 571200 (0x8b740) bytes
      Balance: 3.97675608 SOL
   ```

4. Transfer pauser/unpauser and admin/delegate

   From `deployments/solana-mainnet/OFT.json`

   ```bash
      OFT_STORE=GKzT5jtvcysvWoRN7Kgro1nqriS6QhHjyqrtL6UNK89t
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
      pnpm hardhat lz:oft:send --src-eid 30168 --dst-eid 30101 --to <EVM_ADDR> --amount 2 --token-program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
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

1. Find ATA

   `spl-token --program-2022 address --token $TOKEN_ADDR --owner $DEPLOYER_ADDR --verbose`

2. Debug

   Use any of OFT_STORE,GET_ADMIN,GET_DELEGATE,CHECKS,GET_TOKEN,GET_PEERS,RATE_LIMITS.

   ```bash
      pnpm hardhat lz:oft:solana:debug --action delegate --eid 30168
      pnpm hardhat lz:oft:solana:debug --action admin --eid 30168
      pnpm hardhat lz:oft:solana:debug --action checks --eid 30168
   ```
