# SSA POAP Minting System

A Node.js CLI tool for Solana Students Africa (SSA) to mint two tiers of compressed NFT POAPs using Metaplex Bubblegum directly on Solana.

## Overview

This system mints two types of POAPs:

1. **Participation POAP** - Awarded to all attendees of the SSA Campus Tour 2025
2. **Builder POAP** - Awarded to participants who demonstrated on-chain activity during the tour period

Compressed NFTs (cNFTs) are used to dramatically reduce minting costs (~$0.0001 per NFT vs ~$0.01 for regular NFTs).

## Prerequisites

- **Node.js** v18 or higher
- **Solana Wallet** with SOL balance:
  - Devnet: Get free SOL from [Sol Faucet](https://faucet.solana.com/)
  - Mainnet: ~1-2 SOL recommended
- **POAP Images** (PNG format, placed in `assets/` folder)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ssa-poap-metaplex

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## Configuration

Edit `.env` with your settings:

```bash
# Network: 'devnet' for testing, 'mainnet-beta' for production
NETWORK=devnet

# Your wallet's private key (base58 encoded)
# Export from Phantom: Settings -> Security & Privacy -> Export Private Key
PRIVATE_KEY=your_private_key_here

# Optional: Custom RPC endpoint for better performance
RPC_URL=

# Tour dates for builder verification
TOUR_START_DATE=2025-01-01
TOUR_END_DATE=2025-12-31
```

## Adding Participant Data

Edit `data/participants.json`:

```json
{
  "participants": [
    {
      "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "name": "Adaora Nwankwo",
      "email": "adaora@example.com",
      "campus": "University of Lagos"
    }
  ]
}
```

Required fields:
- `wallet` - Solana wallet address (base58)

Optional fields:
- `name` - Participant name (for display)
- `email` - Contact email
- `campus` - University/campus name

## Usage

Run scripts in order:

### Step 1: Upload Assets

Upload POAP images and metadata to Arweave:

```bash
npm run upload
# or: node scripts/1-upload-assets.js
```

**Requirements:**
- Place images in `assets/`:
  - `assets/participation-poap.png`
  - `assets/builder-poap.png`
- Wallet needs ~0.1 SOL for upload fees

### Step 2: Create Merkle Trees

Create on-chain Merkle trees for compressed NFTs:

```bash
npm run create-trees
# or: node scripts/2-create-trees.js
```

**Cost:** ~0.3-0.5 SOL per tree (total ~0.6-1 SOL)

### Step 3: Verify Builders

Check participant wallets for on-chain activity:

```bash
npm run verify
# or: node scripts/3-verify-builders.js
```

This identifies participants who shipped on-chain during the tour period and saves them to `data/builders.json`.

### Step 4: Mint Participation POAPs

Mint Participation tier to all participants:

```bash
npm run mint-participation
# or: node scripts/4-mint-participation.js
```

**Cost:** ~0.0001 SOL per mint

### Step 5: Mint Builder POAPs

Mint Builder tier to verified builders:

```bash
npm run mint-builders
# or: node scripts/5-mint-builders.js
```

## Switching from Devnet to Mainnet

1. **Test thoroughly on devnet first**
2. Update `.env`:
   ```bash
   NETWORK=mainnet-beta
   ```
3. Fund your wallet with mainnet SOL
4. For better reliability, use a dedicated RPC:
   ```bash
   RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
   ```
5. Re-run all scripts (they create new assets/trees for mainnet)

## Cost Breakdown

| Operation | Devnet | Mainnet (est.) |
|-----------|--------|----------------|
| Upload images | Free | ~0.01-0.05 SOL |
| Upload metadata | Free | ~0.001 SOL |
| Create tree (x2) | ~0.7 SOL | ~0.7 SOL |
| Mint per NFT | ~0.0001 SOL | ~0.0001 SOL |
| **100 participants** | ~0.7 SOL | ~0.8 SOL |
| **1000 participants** | ~0.8 SOL | ~0.9 SOL |

## Troubleshooting

### "PRIVATE_KEY is not valid base58"
- Ensure you copied the complete private key
- The key should be 88 characters (64 bytes in base58)
- Do not include quotes around the key in `.env`

### "Insufficient balance"
- Check your wallet balance: `solana balance`
- Fund wallet from faucet (devnet) or transfer SOL (mainnet)

### "Rate limited" or timeout errors
- Use a dedicated RPC endpoint (Helius, Triton, QuickNode)
- The scripts include automatic delays between operations

### "Config not found"
- Run scripts in order (1 through 5)
- Check that `data/config.json` exists after each step

### "Missing asset files"
- Ensure images are in `assets/` folder
- File names must be exactly:
  - `participation-poap.png`
  - `builder-poap.png`

### Partial minting failures
- Check `results/` folder for detailed logs
- Re-run the script - it will continue from where it stopped
- Individual failures won't stop the batch

## Project Structure

```
ssa-poap-metaplex/
├── src/
│   ├── config.js          # Configuration loader
│   ├── umi.js             # Umi client setup
│   ├── upload.js          # Arweave uploads
│   ├── merkle-tree.js     # Tree creation
│   ├── mint.js            # NFT minting
│   ├── verify.js          # Builder verification
│   └── utils.js           # Helper functions
├── scripts/
│   ├── 1-upload-assets.js
│   ├── 2-create-trees.js
│   ├── 3-verify-builders.js
│   ├── 4-mint-participation.js
│   └── 5-mint-builders.js
├── assets/                # POAP images (you provide)
├── data/
│   ├── participants.json  # Participant list (you provide)
│   ├── builders.json      # Verified builders (generated)
│   └── config.json        # URIs and addresses (generated)
├── results/               # Minting results (generated)
├── .env                   # Your configuration (gitignored)
└── .env.example           # Configuration template
```

## Security Notes

- **Never share or commit your private key**
- The `.gitignore` excludes `.env` and sensitive files
- Results files contain transaction data, not private keys
- Verify wallet addresses before mainnet minting

## License

MIT

## Credits

Built for [Solana Students Africa](https://solanastudentsafrica.com) Campus Tour 2025.

Powered by:
- [Metaplex Bubblegum](https://developers.metaplex.com/bubblegum) - Compressed NFTs
- [Umi](https://developers.metaplex.com/umi) - Metaplex SDK
- [Irys](https://irys.xyz) - Arweave uploads
