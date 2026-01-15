#!/usr/bin/env node

/**
 * Script 5: Mint Builder POAPs to verified builders
 *
 * This script mints the Builder tier POAP to all verified builders
 * identified in the verification step.
 *
 * Prerequisites:
 * - Scripts 1-3 completed
 * - data/builders.json populated from verification
 * - Wallet funded with SOL
 *
 * Usage:
 *   node scripts/5-mint-builders.js           # Normal minting
 *   node scripts/5-mint-builders.js --dry-run # Preview without minting
 */

import { validateConfig, getConfig } from '../src/config.js';
import { createUmiClient, getWalletAddress, getWalletBalance } from '../src/umi.js';
import { mintToMany } from '../src/mint.js';
import { BUILDER_METADATA } from '../src/upload.js';
import {
  loadConfig,
  loadBuilders,
  saveResults,
  printHeader,
  printSummary,
  confirm,
  shortenAddress
} from '../src/utils.js';
import { validateAllParticipants } from '../src/validation.js';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('\n🏗️  SSA Builder POAP Minting');
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No actual minting will occur');
  }

  // Validate configuration
  validateConfig();
  const envConfig = getConfig();

  // Load config
  const config = loadConfig();
  if (!config || !config.builder?.treeAddress) {
    console.error('\n❌ Config incomplete. Missing tree address.');
    console.error('   Run `node scripts/2-create-trees.js` first.\n');
    process.exit(1);
  }

  // Load builders
  const builders = loadBuilders();
  if (builders.length === 0) {
    console.error('\n❌ No builders found.');
    console.error('   Run `node scripts/3-verify-builders.js` first.\n');
    process.exit(1);
  }

  // Validate builder data
  console.log('\n🔍 Validating builder data...');
  const validation = validateAllParticipants(builders);

  if (validation.errors.length > 0) {
    console.error('\n❌ Validation errors found:');
    validation.errors.slice(0, 10).forEach(err => console.error(`   • ${err}`));
    if (validation.errors.length > 10) {
      console.error(`   ... and ${validation.errors.length - 10} more errors`);
    }
    console.error('\n   Fix issues in data/builders.json before proceeding.\n');
    process.exit(1);
  }

  if (validation.duplicates.length > 0) {
    console.error(`\n❌ ${validation.duplicates.length} duplicate wallet(s) found in builders.json.`);
    console.error('   Remove duplicates before proceeding.\n');
    process.exit(1);
  }

  console.log(`   ✓ ${validation.summary.validEntries} valid entries`);

  // Initialize Umi
  const umi = createUmiClient();
  const walletAddress = getWalletAddress(umi);
  const balance = await getWalletBalance(umi);

  // Estimate cost
  const estimatedCost = builders.length * 0.0001;

  printHeader('', {
    'Mode': isDryRun ? '🔍 DRY RUN' : '🚀 LIVE',
    'Network': envConfig.network,
    'Wallet': walletAddress,
    'Balance': `${balance.toFixed(4)} SOL`,
    'Verified Builders': builders.length,
    'Estimated Cost': `~${estimatedCost.toFixed(4)} SOL`
  });

  // Check balance
  if (balance < estimatedCost + 0.01) {
    console.warn('\n⚠️  Low balance warning!');
    console.warn(`   Current: ${balance.toFixed(4)} SOL`);
    console.warn(`   Estimated need: ${estimatedCost.toFixed(4)} SOL + buffer\n`);
    if (!isDryRun) {
      console.warn('   Add more SOL before proceeding.\n');
    }
  }

  // Show builder summary
  console.log('\n📋 Verified Builders:');
  builders.slice(0, 5).forEach(b => {
    const name = b.name || shortenAddress(b.wallet);
    console.log(`   - ${name} (${b.transactionCount} txs)`);
  });
  if (builders.length > 5) {
    console.log(`   ... and ${builders.length - 5} more`);
  }

  // Dry run mode - show preview and exit
  if (isDryRun) {
    console.log('\n📋 DRY RUN PREVIEW:');
    console.log('─'.repeat(50));
    console.log(`\n   Would mint ${builders.length} Builder POAPs`);
    console.log(`   Tree: ${shortenAddress(config.builder.treeAddress)}`);
    console.log(`   Metadata: ${config.builder.metadataUri}`);
    console.log('\n' + '─'.repeat(50));
    console.log('✅ Dry run complete. Remove --dry-run flag to mint for real.\n');
    process.exit(0);
  }

  // Mainnet safety check
  if (envConfig.network === 'mainnet-beta') {
    console.log('\n' + '⚠️'.repeat(25));
    console.log('   MAINNET MINTING - This will cost real SOL!');
    console.log('⚠️'.repeat(25));
  }

  // Confirm
  const proceed = await confirm('\nContinue with minting?');
  if (!proceed) {
    console.log('\n❌ Cancelled.\n');
    process.exit(0);
  }

  console.log('\n📤 Minting Builder POAPs...\n');

  // Progress callback
  const onProgress = (current, total, result) => {
    const name = result.recipient.name || 'Unknown';
    const wallet = shortenAddress(result.recipient.wallet);

    if (result.success) {
      console.log(`[${current}/${total}] ✅ ${name} (${wallet})`);
    } else {
      console.log(`[${current}/${total}] ❌ ${name} - ${result.error}`);
    }
  };

  try {
    const startTime = Date.now();
    const { successful, failed } = await mintToMany(
      umi,
      config.builder.treeAddress,
      config.builder.metadataUri,
      builders,
      { name: BUILDER_METADATA.name, symbol: BUILDER_METADATA.symbol },
      onProgress
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const endBalance = await getWalletBalance(umi);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `builders-${timestamp}.json`;
    const resultsPath = saveResults(resultsFile, {
      type: 'builder',
      network: envConfig.network,
      treeAddress: config.builder.treeAddress,
      metadataUri: config.builder.metadataUri,
      successful,
      failed,
      stats: {
        total: builders.length,
        successful: successful.length,
        failed: failed.length,
        duration: `${duration}s`
      }
    });

    printSummary('📊 MINTING SUMMARY', {
      '✅ Successful': successful.length,
      '❌ Failed': failed.length,
      'Duration': `${duration}s`,
      'Cost': `${(balance - endBalance).toFixed(4)} SOL`
    });

    console.log(`\n💾 Results saved to ${resultsPath}`);

    if (failed.length > 0) {
      console.log('\n⚠️  Some mints failed. Check results file for details.');
      console.log('   You can re-run this script to retry failed mints.');
    }

    console.log('\n✨ All done! POAP distribution complete.');
    console.log('\n📊 Final Summary:');
    console.log(`   - Participation POAPs: Check results/participation-*.json`);
    console.log(`   - Builder POAPs: ${successful.length} minted`);
    console.log('\n   Notify your participants to check their wallets!\n');

  } catch (error) {
    console.error('\n❌ Minting failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
