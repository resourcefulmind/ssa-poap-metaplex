#!/usr/bin/env node

/**
 * Script 1: Upload POAP images and metadata to Arweave
 *
 * This script uploads both POAP images and their metadata to Arweave
 * via Irys, then saves the URIs to data/config.json for later use.
 *
 * Prerequisites:
 * - .env configured with NETWORK and PRIVATE_KEY
 * - assets/participation-poap.png exists
 * - assets/builder-poap.png exists
 * - Wallet funded with SOL (for upload fees)
 */

import { validateConfig, getConfig } from '../src/config.js';
import { createUmiClient, getWalletAddress, getWalletBalance } from '../src/umi.js';
import { uploadAllAssets } from '../src/upload.js';
import { assetExists, printHeader, printSummary } from '../src/utils.js';

async function main() {
  console.log('\n🚀 SSA POAP Asset Upload');

  // Validate configuration
  validateConfig();
  const config = getConfig();

  // Initialize Umi
  const umi = createUmiClient();
  const walletAddress = getWalletAddress(umi);
  const balance = await getWalletBalance(umi);

  printHeader('', {
    'Network': config.network,
    'Wallet': walletAddress,
    'Balance': `${balance.toFixed(4)} SOL`
  });

  // Check assets exist
  console.log('\n🔍 Checking assets...');

  const participationExists = assetExists('participation-poap.png');
  const builderExists = assetExists('builder-poap.png');

  console.log(`   participation-poap.png: ${participationExists ? '✅' : '❌'}`);
  console.log(`   builder-poap.png: ${builderExists ? '✅' : '❌'}`);

  if (!participationExists || !builderExists) {
    console.error('\n❌ Missing asset files!');
    console.error('   Place your POAP images in the assets/ folder:');
    console.error('   - assets/participation-poap.png');
    console.error('   - assets/builder-poap.png\n');
    process.exit(1);
  }

  // Check balance
  if (balance < 0.1) {
    console.warn('\n⚠️  Low balance! Uploads may fail.');
    console.warn(`   Current: ${balance.toFixed(4)} SOL`);
    console.warn('   Recommended: 0.1+ SOL\n');
  }

  try {
    // Upload all assets
    const result = await uploadAllAssets(umi);

    console.log('\n💾 Configuration saved to data/config.json');

    printSummary('📊 UPLOAD SUMMARY', {
      'Participation Image': result.participation.imageUri,
      'Participation Metadata': result.participation.metadataUri,
      'Builder Image': result.builder.imageUri,
      'Builder Metadata': result.builder.metadataUri
    });

    console.log('\n✨ Upload complete! Run `node scripts/2-create-trees.js` next.\n');

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);

    if (error.message.includes('insufficient')) {
      console.error('\n   Your wallet may need more SOL for upload fees.');
      console.error('   Fund your wallet and try again.\n');
    }

    process.exit(1);
  }
}

main().catch(console.error);
