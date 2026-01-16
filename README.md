# SSA POAP Minting System

A Node.js CLI tool for minting compressed NFT POAPs on Solana using Metaplex Bubblegum.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA PREPARATION                                   │
│                                                                              │
│   raw-data/                    consolidate-data.js      data/                │
│   ├── wallets.csv        ──────────────────────────►   participants.json    │
│   ├── luma-unilag.csv                                                        │
│   └── luma-funaab.csv          identify-builders.js                          │
│                          ──────────────────────────►   builders.json         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VALIDATION                                      │
│                                                                              │
│   0-validate-data.js                                                         │
│   ├── Check wallet addresses (valid base58, 32-44 chars)                     │
│   ├── Find duplicates                                                        │
│   └── Validate emails                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               SETUP                                          │
│                                                                              │
│   1-upload-assets.js              2-create-trees.js                          │
│   ├── Upload images to Arweave    ├── Create participation tree              │
│   └── Upload metadata JSON        └── Create builder tree                    │
│            │                               │                                 │
│            └───────────► data/config.json ◄┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MINTING                                         │
│                                                                              │
│   4-mint-participation.js         5-mint-builders.js                         │
│   ├── Read participants.json      ├── Read builders.json                     │
│   ├── Mint cNFT to each wallet    ├── Mint cNFT to each wallet               │
│   └── Save to results/            └── Save to results/                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NOTIFICATIONS                                     │
│                                                                              │
│   6-send-emails.js                                                           │
│   ├── Send participation emails to those with email addresses                │
│   └── Send builder emails to verified builders                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

**Already have `participants.json` and `builders.json` ready?**

```bash
npm install
cp .env.example .env         # Add your private key
npm run validate             # Check data quality
npm run upload               # Upload images to Arweave
npm run create-trees         # Create Merkle trees
npm run mint-participation   # Mint to all participants
npm run mint-builders        # Mint to builders
npm run send-emails          # Notify via email
```

## Full Workflow

### Phase 1: Data Preparation

If you're starting with raw data from Luma (registrations) and Google Sheets (wallets):

```
raw-data/
├── wallets.csv              # Columns: Full Name, Program ID, Devnet Wallet Address, Github profile
├── luma-unilag.csv          # Luma export for UNILAG campus
├── luma-funaab.csv          # Luma export for FUNAAB campus
└── ...                      # More Luma exports
```

**Step 1: Consolidate data sources**

```bash
node scripts/consolidate-data.js
```

This script:
- Matches Luma registrations (emails) with wallet data (by name)
- Uses fuzzy matching for name variations
- Outputs `data/participants.json` with merged records
- Creates review reports in `raw-data/reports/` for manual checks

**Step 2: Identify builders**

```bash
node scripts/identify-builders.js
```

This script:
- Reads `raw-data/wallets.csv` for Program ID column
- Anyone with a non-empty Program ID = builder
- Cross-references with `participants.json`
- Outputs `data/builders.json`

### Phase 2: Validation

```bash
npm run validate
# or: node scripts/0-validate-data.js
```

Checks for:
- Invalid wallet addresses (wrong format, invalid base58)
- Duplicate entries (same wallet or name)
- Missing/malformed email addresses

**Auto-fix minor issues:**
```bash
node scripts/0-validate-data.js --fix
```

### Phase 3: Setup (Blockchain)

**Upload POAP artwork to Arweave:**

```bash
npm run upload
```

Requirements:
- `assets/participation-poap.png` - Participation tier image
- `assets/builder-poap.png` - Builder tier image
- ~0.05 SOL for upload fees

Output: Updates `data/config.json` with image and metadata URIs.

**Create Merkle trees:**

```bash
npm run create-trees
```

Creates two on-chain Merkle trees for compressed NFT storage.

Cost: ~0.02-0.5 SOL per tree (depends on tree size)

Output: Updates `data/config.json` with tree addresses.

### Phase 4: Minting

**Mint Participation POAPs:**

```bash
npm run mint-participation
```

- Reads `data/participants.json`
- Mints one cNFT per wallet
- Shows live progress
- Saves results to `results/participation-{timestamp}.json`

**Mint Builder POAPs:**

```bash
npm run mint-builders
```

- Reads `data/builders.json`
- Mints one cNFT per wallet (in addition to participation POAP)
- Saves results to `results/builders-{timestamp}.json`

Cost: ~0.0001 SOL per mint

### Phase 5: Email Notifications

```bash
npm run send-emails
```

Sends styled HTML emails to participants with:
- POAP image
- Link to view on Solscan
- Wallet instructions

Requires Resend API key in `.env`.

## Configuration

### Environment Variables

```bash
# Network: 'devnet' for testing, 'mainnet-beta' for production
NETWORK=devnet

# Your wallet private key (base58 encoded)
# Export from Phantom: Settings > Security & Privacy > Export Private Key
PRIVATE_KEY=your_private_key_here

# Optional: Custom RPC for better performance
RPC_URL=

# Email configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=poap@yourdomain.com
EMAIL_REPLY_TO=your@email.com
```

### Data Files

| File | Description | Created By |
|------|-------------|------------|
| `data/participants.json` | All participants (wallet, name, email, campus) | You or `consolidate-data.js` |
| `data/builders.json` | Verified builders subset | `identify-builders.js` or `3-verify-builders.js` |
| `data/config.json` | URIs and tree addresses | Scripts 1 & 2 |
| `data/participants.example.json` | Template showing expected format | Included |

### participants.json Format

```json
{
  "participants": [
    {
      "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "name": "Adaora Nwankwo",
      "email": "adaora@example.com",
      "campus": "UNILAG"
    }
  ]
}
```

Required: `wallet`
Optional: `name`, `email`, `campus`

## Scripts Reference

| Script | Command | Input | Output |
|--------|---------|-------|--------|
| `consolidate-data.js` | `node scripts/consolidate-data.js` | `raw-data/*.csv` | `data/participants.json` |
| `identify-builders.js` | `node scripts/identify-builders.js` | `raw-data/wallets.csv`, `data/participants.json` | `data/builders.json` |
| `0-validate-data.js` | `npm run validate` | `data/participants.json` | Validation report |
| `1-upload-assets.js` | `npm run upload` | `assets/*.png` | `data/config.json` (URIs) |
| `2-create-trees.js` | `npm run create-trees` | — | `data/config.json` (trees) |
| `3-verify-builders.js` | `npm run verify` | `data/participants.json` | `data/builders.json` |
| `4-mint-participation.js` | `npm run mint-participation` | `data/participants.json`, `config.json` | `results/*.json` |
| `5-mint-builders.js` | `npm run mint-builders` | `data/builders.json`, `config.json` | `results/*.json` |
| `6-send-emails.js` | `npm run send-emails` | `results/*.json` | Emails sent |

## Cost Breakdown

| Operation | Devnet | Mainnet |
|-----------|--------|---------|
| Upload images | Free | ~0.01-0.05 SOL |
| Create trees (x2) | ~0.04 SOL | ~0.04-0.5 SOL |
| Mint per NFT | ~0.0001 SOL | ~0.0001 SOL |
| **100 participants** | ~0.05 SOL | ~0.1 SOL |
| **500 participants** | ~0.1 SOL | ~0.15 SOL |

## Troubleshooting

### "Invalid wallet address"
- Must be 32-44 characters, base58 encoded
- No spaces, special characters, or URLs
- Run `npm run validate --fix` to auto-clean

### "Insufficient balance"
- Check balance: `solana balance`
- Devnet: Get SOL from [faucet.solana.com](https://faucet.solana.com)
- Mainnet: Transfer SOL to your wallet

### "Rate limited" / 429 errors
- Use a dedicated RPC (Helius, Triton, QuickNode)
- Scripts have built-in retry logic with backoff

### "Config not found"
- Run scripts in order: upload → create-trees → mint
- Check `data/config.json` exists

### Emails not sending
- Verify `RESEND_API_KEY` is set
- Check sender domain is verified in Resend
- Free tier: 100 emails/day limit

## Project Structure

```
ssa-poap-metaplex/
├── scripts/
│   ├── consolidate-data.js    # Merge Luma + wallet data
│   ├── identify-builders.js   # Find builders by Program ID
│   ├── 0-validate-data.js     # Validate before minting
│   ├── 1-upload-assets.js     # Upload to Arweave
│   ├── 2-create-trees.js      # Create Merkle trees
│   ├── 3-verify-builders.js   # On-chain activity check
│   ├── 4-mint-participation.js
│   ├── 5-mint-builders.js
│   └── 6-send-emails.js
├── src/
│   ├── config.js              # Load configuration
│   ├── umi.js                 # Metaplex client
│   ├── upload.js              # Arweave uploads
│   ├── merkle-tree.js         # Tree operations
│   ├── mint.js                # Minting logic
│   ├── verify.js              # Builder verification
│   ├── email.js               # Email sending
│   ├── email-templates.js     # HTML templates
│   ├── validation.js          # Data validation
│   └── utils.js               # Helpers
├── assets/                    # POAP images (you provide)
├── data/                      # Participant data & config
├── raw-data/                  # Source CSVs (gitignored)
├── results/                   # Minting logs (gitignored)
└── .env                       # Your secrets (gitignored)
```

## Security

These files contain sensitive data and are gitignored:
- `.env` - Private key, API keys
- `data/participants.json` - PII (names, emails, wallets)
- `data/builders.json` - PII
- `raw-data/` - Source data with PII
- `results/` - Minting records

Never commit these files. Use `.env.example` and `data/participants.example.json` as templates.

## License

MIT

## Credits

Built for [Solana Students Africa](https://solanastudentsafrica.com) Campus Tour 2025.

Powered by:
- [Metaplex Bubblegum](https://developers.metaplex.com/bubblegum) - Compressed NFTs
- [Umi](https://developers.metaplex.com/umi) - Metaplex SDK
- [Irys](https://irys.xyz) - Arweave uploads
- [Resend](https://resend.com) - Email delivery
