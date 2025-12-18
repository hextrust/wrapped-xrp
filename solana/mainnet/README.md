# Setup for lz-tool

Prepare `.env` based on `.env.example`

```bash
   export SOLANA_KEYPAIR_PATH=~/deployments/wxrp/mainnet.json # Solana
```

Alternatively the default will be used `~/.config/solana/id.json`

Recommended RPC provider for Solana -> https://www.helius.dev/

# Sending tokens from and to Solana

1. Send Solana to Eth

   ```bash
      pnpm hardhat lz:oft:send --src-eid 30168 --dst-eid 30101 --to <EVM_ADDR> --amount 2 --token-program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
   ```

2. And back

   ```bash
      pnpm hardhat lz:oft:send --src-eid 30101 --dst-eid 30168 --to <SOL_ADDR> --oft-address <EVM_OFT_ADDR> --amount 1
   ```

   (Eth - 30101, Solana - 30168, Hyperliquid - 30367, Optimism - 30111)

# Squads and phantom wallet

Mainnet version - https://app.squads.so/

Alternatively Metamask wallet supports Solana and works fine.

# Token instructions as multisig (squads)

## Mint

1. Generate transaction

   ```bash
      SOL_ADDR=E1LSQ86sxrmkjBthCR8PKpiKrq5YFLxr41VbSZ2XKSJD
      TOKEN_ADDR=WXRPpJt44kNmiQK495uuxPkDPHa4js4K1cyDEWXCNKY
      MULTISIG_ADDR=pq3XcYiEvtUibZPzY4qMiHGyCtZPrDxDf7pYHJ3Nt3k
      OPS_SQUADS_VAULT_ADDR=2WpgARMHmfvvy6sqij5KfKvQFJen7R1DwEocmuMgfjX9
      pnpm hardhat lz:solana:mint --token-addr $TOKEN_ADDR --user-addr $SOL_ADDR --amount 10 --eid 30168 --multisig-addr $MULTISIG_ADDR --squads-addr $OPS_SQUADS_VAULT_ADDR --signer-addr $OPS_SQUADS_VAULT_ADDR
   ```

2. Verify with explorer

   https://explorer.solana.com/tx/inspector?cluster=devnet

3. Import to Tx builder as base58 tx. Simulate, propose and sign.

   https://backup.app.squads.so/#/transactions/

   Note: remember to set multisig and rpc url to `https://api.devnet.solana.com`

4. Check the balance

   ```bash
      spl-token balance $TOKEN_ADDR --owner $SOL_ADDR
   ```

## Burn

1. Generate transaction

   ```bash
       pnpm hardhat lz:solana:burn --token-addr $TOKEN_ADDR --user-addr $SOL_ADDR --amount 1 --eid 30168 --squads-addr $OPS_SQUADS_VAULT_ADDR --signer-addr $OPS_SQUADS_VAULT_ADDR
   ```

## Pause/unpause token

1. Generate transaction

   Use `lz:solana:pause` to pause token and `lz:solana:resume` to unpause

   ```bash
       pnpm hardhat lz:solana:pause --token-addr $TOKEN_ADDR --eid 30168 --squads-addr $OPS_SQUADS_VAULT_ADDR --signer-addr $OPS_SQUADS_VAULT_ADDR
   ```

## Blacklist user (or unblacklist)

1. Generate transaction

   Use `lz:solana:blacklist` to pause token and `lz:solana:unblacklist` to unpause

   ```bash
       pnpm hardhat lz:solana:blacklist --token-addr $TOKEN_ADDR --user-addr $SOL_ADDR --eid 30168 --squads-addr $OPS_SQUADS_VAULT_ADDR --signer-addr $OPS_SQUADS_VAULT_ADDR
   ```

# Change metadata

```bash
   pnpm hardhat lz:solana:update-metadata --token-addr $TOKEN_ADDR --eid 30168 --squads-addr $ADMIN_SQUADS_VAULT_ADDR --field Uri --value https://ipfs.io/ipfs/bafkreig6wrikw4oj4j4j3aws2jaaf2vztpmcuixfe2rgjfp4ua5qlwkpz4
```

# Transfer pause authority

```bash
   pnpm hardhat lz:solana:set-authority --token-addr $TOKEN_ADDR --eid 30168 --squads-addr $ADMIN_SQUADS_VAULT_ADDR --current-authority-addr $ADMIN_SQUADS_VAULT_ADDR --new-authority-addr <NEW_AUTH_ADDR>
```

# Wiring instructions EVMs to Solana

```bash
   pnpm hardhat lz:oapp:wire --oapp-config layerzero.mainnet.config.ts --signer $ADMIN_SQUADS_VAULT_ADDR --skip-connections-from-eids 30168 --output-filename mainnet-txs.log
```

# Wiring instructions Solana to EVMs as multisig (squads)

Required:

```bash
    cargo install bs58-cli
```

## Wire Solana outwards as multisig (squads)

1. Prepare change tx

```bash
    pnpm hardhat lz:oapp:wire --oapp-config layerzero.mainnet.config.ts --signer $ADMIN_SQUADS_VAULT_ADDR --output-filename mainnet-sol-txs.log --skip-connections-from-eids 30101,30111,30367
```

2. Convert each calladata from `mainnet-sol-txs.log` to base58

```bash
   echo "0201080c7ffa2b58d45fd5a2fe855a8115f1948b7744c38af71f281fbd212ff3b322bd0f2176f6d374c8f31f8676e913dfd53496c4fb10c996ea8d9e077920546ce8bc24906b37d9940bedde5c6f7e605c3f774993d084de4d55f6733867263a05d96a74ff4b00a690db853244ac95f729d22190f052fa48deaa8c04d392449a0e314e3616b7830c3f8a44c810ca87de56e032889c358ec75d4732bf7361862658acb2af29ada86fcdf809dfbe3361053fd30d3b26e4d26c031aeb39402efc871f9c31e43bb66c6947983775eb253df3d1c9818c2f958899b64a23b05a51bc8ed358f6e95aad76da514b6e1dcf11037e904dac3d375f525c9fbafcb19507b78907d8c18b619e429a1de67854bd455ee6643f568d6236cde8e9442a3abf029f016faae63064addff32f7e70f064aaeb7199486126df6abfa7e1b33d41a4673fab17868534ecd3ea8ab2798656e0feeb82bf86fd956d0f9017f29ecb30ac3e2738946f4489f6b5e2feee246bf3f87d58e36d7a5821ba27d48475708e46b09308afe3d912eacbee4ab52b8b832ab774fde91370b7195c1b1d360eac37784465e7d3a0ab6bee01070c01050604080403020b0a090887016c9e9aafd462344234e9dcd39e2f02d13047276d6cfaecb10fda22b86e022311edd05fb5aad5fb04aa9d000003000000530000000100000000000000ff0201000000000200000010f76722686ec33f3e58a48458950e7faff5c7e788c7e8b164e2504ffb801c4633cdb9fb56d28a2f028cbb36c254a7d54c92f0419b53e44ddcc0a5c373f854f2" | xxd -r -p | bs58
```

3. Verify with explorer https://explorer.solana.com/tx/inspector?cluster=devnet and upload to https://backup.app.squads.so
