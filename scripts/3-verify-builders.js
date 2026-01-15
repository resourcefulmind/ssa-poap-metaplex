#!/usr/bin/env node

/**
 * Script 3: Verify which participants have on-chain activity
 *
 * This script checks each participant's wallet for on-chain transactions
 * within the tour date range to identify builders.
 *
 * Prerequisites:
 * - data/participants.json with participant data
 * - .env with TOUR_START_DATE and TOUR_END_DATE (optional)
 */

import { validateConfig, getConfig } from '../src/config.js';
import { verifyAllParticipants } from '../src/verify.js';
import { loadParticipants, printHeader, printSummary, formatDate, shortenAddress } from '../src/utils.js';

async function main() {
  console.log('\n🔍 SSA Builder Verification');

  // Validate configuration
  validateConfig();
  const config = getConfig();

  // Load participants
  const participants = loadParticipants();

  if (participants.length === 0) {
    console.error('\n❌ No participants found in data/participants.json');
    console.error('   Add participant data and try again.\n');
    process.exit(1);
  }

  printHeader('', {
    'Network': config.network,
    'Tour Period': `${formatDate(config.tourStartDate)} - ${formatDate(config.tourEndDate)}`,
    'Participants': participants.length
  });

  console.log('\nVerifying on-chain activity...\n');

  // Progress callback
  const onProgress = (current, total, result) => {
    const name = result.participant.name || shortenAddress(result.participant.wallet);
    const wallet = shortenAddress(result.participant.wallet);

    if (result.isBuilder) {
      console.log(`[${current}/${total}] ✅ BUILDER: ${name} (${result.transactionCount} transactions)`);
    } else if (result.error) {
      console.log(`[${current}/${total}] ⚠️  Error: ${name} - ${result.error}`);
    } else {
      console.log(`[${current}/${total}] ⬜ Participant: ${name} (0 transactions)`);
    }
  };

  try {
    const { builders, nonBuilders } = await verifyAllParticipants(
      participants,
      config.tourStartDate,
      config.tourEndDate,
      onProgress
    );

    printSummary('📊 VERIFICATION SUMMARY', {
      'Total Participants': participants.length,
      '✅ Verified Builders': builders.length,
      '⬜ Participants Only': nonBuilders.length
    });

    console.log('\n💾 Builders saved to data/builders.json');
    console.log('\n✨ Verification complete! Ready to mint.');
    console.log('   Next steps:');
    console.log('   1. Run `node scripts/4-mint-participation.js` for all participants');
    console.log('   2. Run `node scripts/5-mint-builders.js` for verified builders\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
