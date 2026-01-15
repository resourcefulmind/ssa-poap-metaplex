# SSA POAP Minting System - Metaplex Direct

## Overview

Build a Node.js CLI tool for Solana Students Africa (SSA) to mint two tiers of compressed NFT POAPs using Metaplex Bubblegum directly. No third-party platform dependencies.

## System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        SETUP PHASE                          │
│  1. Upload images to Arweave via Irys                       │
│  2. Upload metadata JSON to Arweave via Irys                │
│  3. Create Merkle tree on Solana                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     VERIFICATION PHASE                       │
│  Check participant wallets for on-chain activity            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       MINTING PHASE                          │
│  Mint compressed NFTs to recipient wallets                  │
└─────────────────────────────────────────────────────────────┘
```

## POAP Specifications

### Tier 1: Participation POAP
```json
{
  "name": "SSA Campus Tour Participant 2025",
  "symbol": "SSAP",
  "description": "Awarded to attendees of the Solana Students Africa Campus Tour 2025. This POAP recognizes your presence, interest, and membership in the SSA community.",
  "attributes": [
    { "trait_type": "Tier", "value": "Participant" },
    { "trait_type": "Program", "value": "Campus Tour" },
    { "trait_type": "Year", "value": "2025" },
    { "trait_type": "Issuer", "value": "Solana Students Africa" }
  ]
}
```

### Tier 2: Builder POAP
```json
{
  "name": "SSA Campus Tour Builder 2025",
  "symbol": "SSAB",
  "description": "Awarded to builders who shipped on-chain during the Solana Students Africa Campus Tour 2025. This POAP verifies real execution and unlocks access to SSA Builder Programs, including early application access and Builder Spotlight eligibility.",
  "attributes": [
    { "trait_type": "Tier", "value": "Builder" },
    { "trait_type": "Program", "value": "Campus Tour" },
    { "trait_type": "Year", "value": "2025" },
    { "trait_type": "Issuer", "value": "Solana Students Africa" },
    { "trait_type": "Privileges", "value": "Builder Program Early Access, Spotlight Eligibility" }
  ]
}
```

## Project Structure
```
ssa-poap-metaplex/
├── src/
│   ├── config.js              # Load and validate configuration
│   ├── umi.js                 # Initialize Umi client with signer
│   ├── upload.js              # Upload images and metadata to Arweave
│   ├── merkle-tree.js         # Create and manage Merkle trees
│   ├── mint.js                # Mint compressed NFTs
│   ├── verify.js              # Verify on-chain activity
│   └── utils.js               # Helper functions
├── scripts/
│   ├── 1-upload-assets.js     # Upload images and metadata
│   ├── 2-create-trees.js      # Create Merkle trees
│   ├── 3-verify-builders.js   # Check on-chain activity
│   ├── 4-mint-participation.js # Mint participation POAPs
│   └── 5-mint-builders.js     # Mint builder POAPs
├── assets/
│   ├── participation-poap.png # Participation tier image
│   └── builder-poap.png       # Builder tier image
├── data/
│   ├── participants.json      # All participant data
│   ├── builders.json          # Verified builders (generated)
│   └── config.json            # Uploaded URIs and tree addresses (generated)
├── results/
│   └── .gitkeep               # Minting results stored here
├── .env.example               # Environment template
├── .env                       # Actual environment (gitignored)
├── .gitignore
├── package.json
├── README.md
└── CHECKLIST.md
```

## Dependencies
```json
{
  "dependencies": {
    "@metaplex-foundation/mpl-bubblegum": "^3.0.0",
    "@metaplex-foundation/mpl-token-metadata": "^3.0.0",
    "@metaplex-foundation/umi": "^0.9.0",
    "@metaplex-foundation/umi-bundle-defaults": "^0.9.0",
    "@metaplex-foundation/umi-uploader-irys": "^0.9.0",
    "@solana/web3.js": "^1.87.0",
    "bs58": "^5.0.0",
    "dotenv": "^16.3.0"
  }
}
```

## Environment Variables (.env)
```bash
# Network: 'devnet' or 'mainnet-beta'
NETWORK=devnet

# Your wallet's private key (base58 encoded)
# Export from Phantom: Settings -> Export Private Key
PRIVATE_KEY=your_private_key_here

# RPC URL (optional - defaults based on network)
# For better performance, use Helius or Triton
RPC_URL=

# Tour dates for builder verification (ISO format)
TOUR_START_DATE=2025-01-01
TOUR_END_DATE=2025-12-31
```

## Source Files Specifications

### src/config.js
```javascript
/**
 * Configuration loader and validator
 * 
 * Exports:
 * - config object with all settings
 * - validateConfig() function
 * 
 * Must validate:
 * - NETWORK is 'devnet' or 'mainnet-beta'
 * - PRIVATE_KEY exists and is valid base58
 * - Tour dates are valid
 * 
 * Should provide defaults:
 * - RPC_URL based on network
 * - devnet: https://api.devnet.solana.com
 * - mainnet-beta: https://api.mainnet-beta.solana.com
 */
```

### src/umi.js
```javascript
/**
 * Umi client initialization
 * 
 * Exports:
 * - createUmiClient() function that returns configured Umi instance
 * 
 * Must:
 * - Create Umi with appropriate RPC endpoint
 * - Attach keypair signer from PRIVATE_KEY
 * - Attach Irys uploader for Arweave uploads
 * - Use appropriate Irys address based on network:
 *   - devnet: https://devnet.irys.xyz
 *   - mainnet: https://node1.irys.xyz
 */
```

### src/upload.js
```javascript
/**
 * Asset upload functions
 * 
 * Exports:
 * - uploadImage(umi, imagePath) - uploads image, returns URI
 * - uploadMetadata(umi, metadata) - uploads JSON, returns URI
 * - uploadAllAssets(umi) - uploads both POAPs, returns config
 * 
 * Metadata format for upload:
 * {
 *   name: string,
 *   symbol: string,
 *   description: string,
 *   image: string (URI from uploadImage),
 *   attributes: array,
 *   properties: {
 *     files: [{ uri: string, type: "image/png" }],
 *     category: "image"
 *   }
 * }
 * 
 * uploadAllAssets should:
 * 1. Upload participation image
 * 2. Create participation metadata with image URI
 * 3. Upload participation metadata
 * 4. Repeat for builder
 * 5. Save URIs to data/config.json
 * 6. Return the config object
 */
```

### src/merkle-tree.js
```javascript
/**
 * Merkle tree management
 * 
 * Exports:
 * - createMerkleTree(umi, maxDepth, maxBufferSize) - creates tree, returns address
 * - createBothTrees(umi) - creates trees for both tiers
 * 
 * Tree parameters for ~10,000 NFTs capacity:
 * - maxDepth: 14
 * - maxBufferSize: 64
 * 
 * createBothTrees should:
 * 1. Create participation tree
 * 2. Create builder tree
 * 3. Save addresses to data/config.json
 * 4. Return the addresses
 * 
 * Note: Creating a tree costs ~0.2-0.5 SOL depending on size
 */
```

### src/mint.js
```javascript
/**
 * Minting functions
 * 
 * Exports:
 * - mintCompressedNFT(umi, treeAddress, metadataUri, recipient, collection)
 * - mintToMany(umi, treeAddress, metadataUri, recipients, onProgress)
 * 
 * mintCompressedNFT should:
 * 1. Create the mint instruction using mintV1 from mpl-bubblegum
 * 2. Set leafOwner to recipient
 * 3. Set merkleTree to treeAddress
 * 4. Set metadata (name, symbol, uri, sellerFeeBasisPoints: 0, creators: [])
 * 5. Send and confirm transaction
 * 6. Return transaction signature
 * 
 * mintToMany should:
 * 1. Iterate through recipients
 * 2. Call mintCompressedNFT for each
 * 3. Handle errors gracefully (continue on failure, log error)
 * 4. Call onProgress callback after each mint
 * 5. Add 500ms delay between mints to avoid rate limiting
 * 6. Return results object { successful: [], failed: [] }
 */
```

### src/verify.js
```javascript
/**
 * Builder verification
 * 
 * Exports:
 * - checkWalletActivity(connection, walletAddress, startDate, endDate)
 * - verifyAllParticipants(participants, startDate, endDate)
 * 
 * checkWalletActivity should:
 * 1. Get transaction signatures for wallet
 * 2. Filter by date range
 * 3. Return { isBuilder: boolean, transactionCount: number, firstTx: string }
 * 
 * verifyAllParticipants should:
 * 1. Load participants from data/participants.json
 * 2. Check each wallet
 * 3. Save builders to data/builders.json
 * 4. Return { builders: [], nonBuilders: [] }
 */
```

### src/utils.js
```javascript
/**
 * Utility functions
 * 
 * Exports:
 * - loadJson(filepath) - load and parse JSON file
 * - saveJson(filepath, data) - save data as JSON
 * - delay(ms) - promise-based delay
 * - shortenAddress(address) - truncate for display
 * - formatDate(date) - format date for logging
 * - loadConfig() - load data/config.json
 * - saveConfig(config) - save to data/config.json
 * - loadParticipants() - load data/participants.json
 * - loadBuilders() - load data/builders.json
 * - saveBuilders(builders) - save to data/builders.json
 * - saveResults(filename, results) - save to results/filename
 */
```

## Script Specifications

### scripts/1-upload-assets.js
```javascript
/**
 * Upload POAP images and metadata to Arweave
 * 
 * Flow:
 * 1. Validate configuration
 * 2. Check assets exist in assets/ folder
 * 3. Initialize Umi client
 * 4. Fund Irys uploader if needed (will prompt)
 * 5. Upload participation image
 * 6. Create and upload participation metadata
 * 7. Upload builder image
 * 8. Create and upload builder metadata
 * 9. Save URIs to data/config.json
 * 10. Print summary with URIs
 * 
 * Console output example:
 * 
 * 🚀 SSA POAP Asset Upload
 * ==================================================
 * Network: devnet
 * Wallet: 7xKX...sAsU
 * ==================================================
 * 
 * 📤 Uploading Participation POAP...
 *    Image: ✅ https://arweave.net/abc123
 *    Metadata: ✅ https://arweave.net/def456
 * 
 * 📤 Uploading Builder POAP...
 *    Image: ✅ https://arweave.net/ghi789
 *    Metadata: ✅ https://arweave.net/jkl012
 * 
 * 💾 Configuration saved to data/config.json
 * 
 * ✨ Upload complete! Run `node scripts/2-create-trees.js` next.
 */
```

### scripts/2-create-trees.js
```javascript
/**
 * Create Merkle trees for compressed NFTs
 * 
 * Flow:
 * 1. Validate configuration
 * 2. Load config.json (must have URIs from step 1)
 * 3. Initialize Umi client
 * 4. Check wallet balance (warn if low)
 * 5. Create participation tree
 * 6. Create builder tree
 * 7. Save tree addresses to data/config.json
 * 8. Print summary
 * 
 * Console output example:
 * 
 * 🌳 SSA POAP Merkle Tree Creation
 * ==================================================
 * Network: devnet
 * Wallet: 7xKX...sAsU
 * Balance: 1.5 SOL
 * ==================================================
 * 
 * ⚠️  Creating trees costs ~0.3-0.5 SOL each
 *    Continue? (y/n): y
 * 
 * 🌳 Creating Participation tree...
 *    ✅ Address: TreeAddress1...
 *    Cost: 0.35 SOL
 * 
 * 🌳 Creating Builder tree...
 *    ✅ Address: TreeAddress2...
 *    Cost: 0.35 SOL
 * 
 * 💾 Configuration saved to data/config.json
 * 
 * ✨ Trees created! Add participant data, then run verification.
 */
```

### scripts/3-verify-builders.js
```javascript
/**
 * Verify which participants have on-chain activity
 * 
 * Flow:
 * 1. Validate configuration
 * 2. Load participants.json
 * 3. Initialize Solana connection
 * 4. For each participant, check on-chain activity
 * 5. Save verified builders to builders.json
 * 6. Print summary
 * 
 * Console output example:
 * 
 * 🔍 SSA Builder Verification
 * ==================================================
 * Network: devnet
 * Tour Period: Jan 1, 2025 - Dec 31, 2025
 * Participants: 150
 * ==================================================
 * 
 * Verifying on-chain activity...
 * 
 * [1/150] ✅ BUILDER: Adaora N. (5 transactions)
 * [2/150] ⬜ Participant: Kwame A. (0 transactions)
 * [3/150] ✅ BUILDER: Fatima M. (12 transactions)
 * ...
 * 
 * ==================================================
 * 📊 VERIFICATION SUMMARY
 * ==================================================
 * Total Participants: 150
 * ✅ Verified Builders: 45
 * ⬜ Participants Only: 105
 * 
 * 💾 Builders saved to data/builders.json
 * 
 * ✨ Verification complete! Ready to mint.
 */
```

### scripts/4-mint-participation.js
```javascript
/**
 * Mint Participation POAPs to all participants
 * 
 * Flow:
 * 1. Validate configuration
 * 2. Load config.json (needs URIs and tree addresses)
 * 3. Load participants.json
 * 4. Initialize Umi client
 * 5. Confirm minting (show count and estimated cost)
 * 6. Mint to each participant
 * 7. Save results
 * 8. Print summary
 * 
 * Console output example:
 * 
 * 🎫 SSA Participation POAP Minting
 * ==================================================
 * Network: devnet
 * Wallet: 7xKX...sAsU
 * Balance: 0.8 SOL
 * ==================================================
 * 
 * Recipients: 150
 * Estimated cost: ~0.015 SOL
 * 
 * Continue? (y/n): y
 * 
 * 📤 Minting Participation POAPs...
 * 
 * [1/150] ✅ Adaora N. (7xKX...sAsU)
 * [2/150] ✅ Kwame A. (9WzD...AWWM)
 * [3/150] ❌ Fatima M. - Error: Invalid address
 * ...
 * 
 * ==================================================
 * 📊 MINTING SUMMARY
 * ==================================================
 * ✅ Successful: 148
 * ❌ Failed: 2
 * 
 * 💾 Results saved to results/participation-2025-01-13T...json
 * 
 * ✨ Done! Run `node scripts/5-mint-builders.js` for builder POAPs.
 */
```

### scripts/5-mint-builders.js
```javascript
/**
 * Mint Builder POAPs to verified builders
 * 
 * Flow:
 * 1. Validate configuration
 * 2. Load config.json
 * 3. Load builders.json (must exist from verification)
 * 4. Initialize Umi client
 * 5. Confirm minting
 * 6. Mint to each builder
 * 7. Save results
 * 8. Print summary
 * 
 * Console output same format as participation script.
 */
```

## Data File Schemas

### data/participants.json
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

### data/builders.json (generated by verification)
```json
{
  "builders": [
    {
      "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "name": "Adaora Nwankwo",
      "email": "adaora@example.com",
      "campus": "University of Lagos",
      "transactionCount": 5,
      "firstTx": "5UxV7..."
    }
  ]
}
```

### data/config.json (generated by scripts)
```json
{
  "network": "devnet",
  "participation": {
    "imageUri": "https://arweave.net/...",
    "metadataUri": "https://arweave.net/...",
    "treeAddress": "TreePublicKey..."
  },
  "builder": {
    "imageUri": "https://arweave.net/...",
    "metadataUri": "https://arweave.net/...",
    "treeAddress": "TreePublicKey..."
  },
  "createdAt": "2025-01-13T..."
}
```

## README.md Requirements

Include:
1. Project overview (what this does)
2. Prerequisites (Node.js, wallet with SOL)
3. Installation (`npm install`)
4. Configuration (.env setup)
5. Adding participant data
6. Step-by-step usage:
   - Step 1: Upload assets
   - Step 2: Create trees
   - Step 3: Verify builders
   - Step 4: Mint participation
   - Step 5: Mint builders
7. Switching from devnet to mainnet
8. Troubleshooting common errors
9. Cost breakdown

## CHECKLIST.md Requirements

Step-by-step execution guide with checkboxes:
- [ ] Pre-work (wallet, funding)
- [ ] Configuration
- [ ] Testing on devnet
- [ ] Real data preparation
- [ ] Mainnet execution
- [ ] Notification

## Error Handling Requirements

All scripts must:
1. Validate configuration before running
2. Check required files exist
3. Confirm destructive/costly operations
4. Handle individual mint failures without crashing
5. Save progress so reruns skip completed items
6. Provide clear, actionable error messages

## Console Output Requirements

All scripts must:
1. Show clear headers with network and wallet info
2. Use emoji indicators: ✅ success, ❌ failure, ⬜ pending, 🔍 checking, 📤 uploading, 🌳 tree, 💾 saving
3. Show progress as [current/total]
4. Print summary at end
5. Indicate next step to run

## Security Requirements

1. Never log private keys
2. Never commit .env file
3. Validate wallet addresses before minting
4. Confirm costly operations
5. Support dry-run mode (optional, nice to have)