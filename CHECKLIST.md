# SSA POAP Minting Checklist

Step-by-step execution guide for minting SSA Campus Tour POAPs.

---

## Phase 1: Pre-Work

### Wallet Setup
- [ ] Create or select a Solana wallet (Phantom, Solflare, etc.)
- [ ] Export private key (Settings -> Security -> Export Private Key)
- [ ] Store private key securely (password manager recommended)

### Devnet Funding
- [ ] Visit [Solana Faucet](https://faucet.solana.com/)
- [ ] Request 2 SOL for devnet testing
- [ ] Verify balance: `solana balance --url devnet`

### Project Setup
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Add private key to `.env`
- [ ] Set `NETWORK=devnet`

---

## Phase 2: Asset Preparation

### POAP Images
- [ ] Design participation POAP image (recommended: 500x500 PNG)
- [ ] Design builder POAP image (recommended: 500x500 PNG)
- [ ] Save as `assets/participation-poap.png`
- [ ] Save as `assets/builder-poap.png`

### Participant Data
- [ ] Collect participant wallet addresses
- [ ] Format data in `data/participants.json`:
  ```json
  {
    "participants": [
      { "wallet": "...", "name": "...", "email": "...", "campus": "..." }
    ]
  }
  ```
- [ ] Verify all wallet addresses are valid (32-44 characters, base58)
- [ ] Remove any duplicate entries

---

## Phase 3: Devnet Testing

### Step 1: Upload Assets
- [ ] Run `npm run upload`
- [ ] Verify success message
- [ ] Check `data/config.json` has image and metadata URIs
- [ ] Test URIs in browser (should show image/JSON)

### Step 2: Create Trees
- [ ] Run `npm run create-trees`
- [ ] Confirm when prompted (costs ~0.7 SOL)
- [ ] Verify tree addresses saved to `data/config.json`

### Step 3: Verify Builders
- [ ] Run `npm run verify`
- [ ] Review verification summary
- [ ] Check `data/builders.json` has correct builders

### Step 4: Mint Participation
- [ ] Run `npm run mint-participation`
- [ ] Confirm when prompted
- [ ] Wait for all mints to complete
- [ ] Check results in `results/participation-*.json`
- [ ] Verify NFTs in recipient wallets (use [Solscan](https://solscan.io/?cluster=devnet))

### Step 5: Mint Builders
- [ ] Run `npm run mint-builders`
- [ ] Confirm when prompted
- [ ] Check results in `results/builders-*.json`
- [ ] Verify builder NFTs in wallets

### Testing Verification
- [ ] Check a participation wallet on Solscan - should show POAP
- [ ] Check a builder wallet - should show both POAPs
- [ ] Verify metadata displays correctly (name, image, attributes)

---

## Phase 4: Mainnet Preparation

### Funding
- [ ] Calculate required SOL:
  - Tree creation: ~0.7 SOL
  - Uploads: ~0.05 SOL
  - Minting: ~0.0001 SOL × participant count
  - Buffer: 0.5 SOL
- [ ] Transfer SOL to minting wallet
- [ ] Verify balance: `solana balance`

### Configuration
- [ ] Update `.env`: `NETWORK=mainnet-beta`
- [ ] (Optional) Add dedicated RPC URL for reliability
- [ ] Delete `data/config.json` (fresh start for mainnet)

### Final Data Check
- [ ] Verify all participant wallets are correct
- [ ] Double-check no test wallets in production data
- [ ] Backup `data/participants.json`

---

## Phase 5: Mainnet Execution

### Upload (Mainnet)
- [ ] Run `npm run upload`
- [ ] Save the image/metadata URIs (for records)
- [ ] Verify URIs work in browser

### Create Trees (Mainnet)
- [ ] Run `npm run create-trees`
- [ ] Save tree addresses (for records)
- [ ] Note remaining wallet balance

### Verify Builders (Mainnet)
- [ ] Run `npm run verify`
- [ ] Review builder list carefully
- [ ] Confirm builder count matches expectations

### Mint Participation (Mainnet)
- [ ] Run `npm run mint-participation`
- [ ] Monitor progress
- [ ] Note any failures
- [ ] Save results file

### Mint Builders (Mainnet)
- [ ] Run `npm run mint-builders`
- [ ] Monitor progress
- [ ] Save results file

### Post-Minting Verification
- [ ] Check sample wallets on [Solscan](https://solscan.io/)
- [ ] Verify NFTs display correctly
- [ ] Confirm metadata is accurate
- [ ] Review any failed mints in results files

---

## Phase 6: Notification

### Announce to Participants
- [ ] Prepare announcement message
- [ ] Include instructions to view POAPs:
  - Phantom: Collectibles tab
  - Solflare: NFTs section
  - Solscan: Enter wallet address
- [ ] Send notifications (email/Discord/Twitter)

### Documentation
- [ ] Archive all results files
- [ ] Document tree addresses and URIs
- [ ] Record total costs
- [ ] Note any issues encountered

---

## Quick Reference

### Commands
```bash
npm run upload           # Step 1: Upload assets
npm run create-trees     # Step 2: Create Merkle trees
npm run verify           # Step 3: Verify builders
npm run mint-participation  # Step 4: Mint to all
npm run mint-builders    # Step 5: Mint to builders
```

### Important Files
| File | Purpose |
|------|---------|
| `.env` | Configuration (private key, network) |
| `data/participants.json` | Participant wallet list |
| `data/builders.json` | Verified builders (generated) |
| `data/config.json` | URIs and addresses (generated) |
| `results/*.json` | Minting results (generated) |

### Useful Links
- [Solana Faucet](https://faucet.solana.com/) - Devnet SOL
- [Solscan](https://solscan.io/) - Blockchain explorer
- [Metaplex Docs](https://developers.metaplex.com/bubblegum) - Bubblegum reference

---

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| "Config not found" | Run scripts in order (1-5) |
| "Insufficient balance" | Fund wallet, check with `solana balance` |
| Upload fails | Check wallet has SOL, retry |
| Rate limited | Use dedicated RPC, scripts auto-retry |
| Invalid address | Check wallet format in participants.json |
| Partial failures | Re-run script, skips completed items |
