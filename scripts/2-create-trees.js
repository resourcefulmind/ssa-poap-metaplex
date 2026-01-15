#!/usr/bin/env node

/**
 * Script 2: Create Merkle trees for compressed NFTs
 *
 * This script creates two Merkle trees on Solana:
 * - One for Participation POAPs
 * - One for Builder POAPs
 *
 * Each tree costs approximately 0.3-0.5 SOL to create.
 *
 * Prerequisites:
 * - Script 1 completed (URIs in data/config.json)
 * - Wallet funded with ~1 SOL
 */

import { validateConfig, getConfig } from '../src/config.js';
import { createUmiClient, getWalletAddress, getWalletBalance } from '../src/umi.js';
import { createBothTrees, estimateTreeCost, DEFAULT_MAX_DEPTH, DEFAULT_MAX_BUFFER_SIZE } from '../src/merkle-tree.js';
import { loadConfig, printHeader, printSummary, confirm } from '../src/utils.js';

async function main() {
  console.log('\n🌳 SSA POAP Merkle Tree Creation');

  // Validate configuration
  validateConfig();
  const envConfig = getConfig();

  // Check that config exists from previous step
  const config = loadConfig();
  if (!config || !config.participation?.metadataUri) {
    console.error('\n❌ Config not found or incomplete.');
    console.error('   Run `node scripts/1-upload-assets.js` first.\n');
    process.exit(1);
  }

  // Initialize Umi
  const umi = createUmiClient();
  const walletAddress = getWalletAddress(umi);
  const balance = await getWalletBalance(umi);

  const estimatedCost = estimateTreeCost(DEFAULT_MAX_DEPTH, DEFAULT_MAX_BUFFER_SIZE);

  printHeader('', {
    'Network': envConfig.network,
    'Wallet': walletAddress,
    'Balance': `${balance.toFixed(4)} SOL`,
    'Tree Capacity': `${Math.pow(2, DEFAULT_MAX_DEPTH).toLocaleString()} NFTs each`
  });

  // Check balance
  const totalEstimatedCost = estimatedCost * 2;
  if (balance < totalEstimatedCost) {
    console.error(`\n❌ Insufficient balance!`);
    console.error(`   Current: ${balance.toFixed(4)} SOL`);
    console.error(`   Estimated need: ${totalEstimatedCost.toFixed(2)} SOL\n`);
    process.exit(1);
  }

  // Confirm with user
  console.log(`\n⚠️  Creating trees costs approximately ${estimatedCost.toFixed(2)} SOL each.`);
  console.log(`   Total estimated cost: ~${totalEstimatedCost.toFixed(2)} SOL`);

  const proceed = await confirm('\nContinue?');
  if (!proceed) {
    console.log('\n❌ Cancelled.\n');
    process.exit(0);
  }

  try {
    const startBalance = balance;
    const result = await createBothTrees(umi);

    // Get new balance
    const endBalance = await getWalletBalance(umi);
    const actualCost = startBalance - endBalance;

    console.log('\n💾 Configuration saved to data/config.json');

    printSummary('📊 TREE CREATION SUMMARY', {
      'Participation Tree': result.participation.treeAddress,
      'Builder Tree': result.builder.treeAddress,
      'Total Cost': `${actualCost.toFixed(4)} SOL`,
      'Remaining Balance': `${endBalance.toFixed(4)} SOL`
    });

    console.log('\n✨ Trees created!');
    console.log('   Next steps:');
    console.log('   1. Add participant data to data/participants.json');
    console.log('   2. Run `node scripts/3-verify-builders.js` to verify builders\n');

  } catch (error) {
    console.error('\n❌ Tree creation failed:', error.message);

    if (error.message.includes('insufficient')) {
      console.error('\n   Your wallet needs more SOL.');
      console.error('   Fund your wallet and try again.\n');
    }

    process.exit(1);
  }
}

main().catch(console.error);
