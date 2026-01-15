#!/usr/bin/env node

/**
 * Script 4: Mint Participation POAPs to all participants
 *
 * This script mints the Participation tier POAP to every participant
 * in the participants.json file.
 *
 * Prerequisites:
 * - Scripts 1-2 completed (URIs and trees in config)
 * - data/participants.json with participant data
 * - Wallet funded with SOL (minimal - ~0.0001 SOL per mint)
 *
 * Usage:
 *   node scripts/4-mint-participation.js           # Normal minting
 *   node scripts/4-mint-participation.js --dry-run # Preview without minting
 */

import { validateConfig, getConfig } from '../src/config.js';
import { createUmiClient, getWalletAddress, getWalletBalance } from '../src/umi.js';
import { mintToMany } from '../src/mint.js';
import { PARTICIPATION_METADATA } from '../src/upload.js';
import {
  loadConfig,
  loadParticipants,
  saveResults,
  printHeader,
  printSummary,
  confirm,
  shortenAddress
} from '../src/utils.js';
import { validateAllParticipants, separateValidInvalid } from '../src/validation.js';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('\n🎫 SSA Participation POAP Minting');
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No actual minting will occur');
  }

  // Validate configuration
  validateConfig();
  const envConfig = getConfig();

  // Load config
  const config = loadConfig();
  if (!config || !config.participation?.treeAddress) {
    console.error('\n❌ Config incomplete. Missing tree address.');
    console.error('   Run `node scripts/2-create-trees.js` first.\n');
    process.exit(1);
  }

  // Load participants
  const participants = loadParticipants();
  if (participants.length === 0) {
    console.error('\n❌ No participants found.');
    console.error('   Add data to data/participants.json\n');
    process.exit(1);
  }

  // Validate participant data
  console.log('\n🔍 Validating participant data...');
  const validation = validateAllParticipants(participants);

  if (validation.errors.length > 0) {
    console.error('\n❌ Validation errors found:');
    validation.errors.slice(0, 10).forEach(err => console.error(`   • ${err}`));
    if (validation.errors.length > 10) {
      console.error(`   ... and ${validation.errors.length - 10} more errors`);
    }
    console.error('\n   Run `npm run validate` to see full report.');
    console.error('   Run `npm run validate -- --fix` to auto-fix issues.\n');
    process.exit(1);
  }

  if (validation.duplicates.length > 0) {
    console.error(`\n❌ ${validation.duplicates.length} duplicate wallet(s) found.`);
    console.error('   Run `npm run validate -- --fix` to auto-remove duplicates.\n');
    process.exit(1);
  }

  console.log(`   ✓ ${validation.summary.validEntries} valid entries`);

  // Initialize Umi
  const umi = createUmiClient();
  const walletAddress = getWalletAddress(umi);
  const balance = await getWalletBalance(umi);

  // Estimate cost (~0.0001 SOL per mint for compressed NFTs)
  const estimatedCost = participants.length * 0.0001;

  printHeader('', {
    'Mode': isDryRun ? '🔍 DRY RUN' : '🚀 LIVE',
    'Network': envConfig.network,
    'Wallet': walletAddress,
    'Balance': `${balance.toFixed(4)} SOL`,
    'Recipients': participants.length,
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

  // Dry run mode - show preview and exit
  if (isDryRun) {
    console.log('\n📋 DRY RUN PREVIEW:');
    console.log('─'.repeat(50));
    console.log(`\n   Would mint ${participants.length} Participation POAPs`);
    console.log(`   Tree: ${shortenAddress(config.participation.treeAddress)}`);
    console.log(`   Metadata: ${config.participation.metadataUri}`);
    console.log('\n   First 5 recipients:');
    participants.slice(0, 5).forEach(p => {
      console.log(`   • ${p.name || 'Unknown'} (${shortenAddress(p.wallet)})`);
    });
    if (participants.length > 5) {
      console.log(`   ... and ${participants.length - 5} more`);
    }
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

  console.log('\n📤 Minting Participation POAPs...\n');

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
      config.participation.treeAddress,
      config.participation.metadataUri,
      participants,
      { name: PARTICIPATION_METADATA.name, symbol: PARTICIPATION_METADATA.symbol },
      onProgress
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const endBalance = await getWalletBalance(umi);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `participation-${timestamp}.json`;
    const resultsPath = saveResults(resultsFile, {
      type: 'participation',
      network: envConfig.network,
      treeAddress: config.participation.treeAddress,
      metadataUri: config.participation.metadataUri,
      successful,
      failed,
      stats: {
        total: participants.length,
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

    console.log('\n✨ Done! Run `node scripts/5-mint-builders.js` for builder POAPs.\n');

  } catch (error) {
    console.error('\n❌ Minting failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
