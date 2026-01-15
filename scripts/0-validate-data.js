#!/usr/bin/env node

/**
 * Script 0: Validate participant data before minting
 *
 * Run this BEFORE any minting to catch issues early.
 * Checks for:
 * - Invalid wallet addresses
 * - Duplicate entries
 * - Missing/invalid email addresses
 * - Missing required fields
 *
 * Usage:
 *   node scripts/0-validate-data.js           # Validate and report
 *   node scripts/0-validate-data.js --fix     # Auto-fix what can be fixed (trim, dedupe)
 */

import 'dotenv/config';
import fs from 'fs';
import {
  validateAllParticipants,
  cleanParticipantData,
  removeDuplicates,
  separateValidInvalid
} from '../src/validation.js';
import {
  loadJson,
  saveJson,
  printHeader,
  PARTICIPANTS_PATH,
  DATA_DIR
} from '../src/utils.js';

// ANSI colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');

  console.log(`\n${colorize('🔍 SSA POAP Data Validation', 'cyan')}`);
  console.log('='.repeat(50));

  // Check if participants file exists
  if (!fs.existsSync(PARTICIPANTS_PATH)) {
    console.error(colorize('\n❌ Participants file not found!', 'red'));
    console.error(`   Expected at: ${PARTICIPANTS_PATH}`);
    console.error('   Create data/participants.json with your participant data.\n');
    process.exit(1);
  }

  // Load participants
  let data;
  try {
    data = loadJson(PARTICIPANTS_PATH);
  } catch (err) {
    console.error(colorize('\n❌ Failed to parse participants.json!', 'red'));
    console.error(`   Error: ${err.message}`);
    console.error('   Make sure the file is valid JSON.\n');
    process.exit(1);
  }

  let participants = data.participants || [];

  console.log(`\n${colorize('📄 File:', 'white')} ${PARTICIPANTS_PATH}`);
  console.log(`${colorize('📊 Entries:', 'white')} ${participants.length}`);

  // If --fix mode, clean data first
  if (shouldFix) {
    console.log(colorize('\n🔧 Fix mode enabled - cleaning data...', 'yellow'));

    // Clean whitespace
    const beforeClean = JSON.stringify(participants);
    participants = cleanParticipantData(participants);
    const afterClean = JSON.stringify(participants);

    if (beforeClean !== afterClean) {
      console.log('   ✓ Trimmed whitespace from fields');
    }

    // Remove duplicates
    const beforeDedupe = participants.length;
    participants = removeDuplicates(participants);
    const removed = beforeDedupe - participants.length;

    if (removed > 0) {
      console.log(`   ✓ Removed ${removed} duplicate entries`);
    }

    // Save cleaned data
    saveJson(PARTICIPANTS_PATH, { participants });
    console.log(colorize('   ✓ Saved cleaned data to participants.json', 'green'));
  }

  // Run validation
  console.log(colorize('\n🔍 Running validation...', 'cyan'));
  const report = validateAllParticipants(participants);

  // Print Summary Box
  console.log('\n' + '═'.repeat(50));
  console.log(colorize('  📊 VALIDATION SUMMARY', 'bold'));
  console.log('═'.repeat(50));

  const { summary } = report;

  // Total entries
  console.log(`\n  Total Entries:      ${colorize(summary.totalEntries.toString(), 'white')}`);

  // Valid/Invalid
  if (summary.invalidEntries === 0) {
    console.log(`  Valid Entries:      ${colorize(summary.validEntries.toString(), 'green')} ✓`);
  } else {
    console.log(`  Valid Entries:      ${colorize(summary.validEntries.toString(), 'green')}`);
    console.log(`  Invalid Entries:    ${colorize(summary.invalidEntries.toString(), 'red')} ✗`);
  }

  // Duplicates
  if (summary.duplicateWallets === 0) {
    console.log(`  Duplicate Wallets:  ${colorize('0', 'green')} ✓`);
  } else {
    console.log(`  Duplicate Wallets:  ${colorize(summary.duplicateWallets.toString(), 'red')} ✗`);
  }

  // Email coverage
  console.log(`\n  With Email:         ${colorize(summary.withEmail.toString(), 'green')} (will be notified)`);
  console.log(`  Without Email:      ${colorize(summary.withoutEmail.toString(), 'yellow')} (no notification)`);

  // Print Errors (if any)
  if (report.errors.length > 0) {
    console.log('\n' + '─'.repeat(50));
    console.log(colorize(`  ❌ ERRORS (${report.errors.length}) - Must fix before minting`, 'red'));
    console.log('─'.repeat(50));

    report.errors.slice(0, 20).forEach(err => {
      console.log(`  • ${err}`);
    });

    if (report.errors.length > 20) {
      console.log(colorize(`  ... and ${report.errors.length - 20} more errors`, 'dim'));
    }
  }

  // Print Duplicates (if any)
  if (report.duplicates.length > 0) {
    console.log('\n' + '─'.repeat(50));
    console.log(colorize(`  ⚠️  DUPLICATES (${report.duplicates.length})`, 'yellow'));
    console.log('─'.repeat(50));

    report.duplicates.slice(0, 10).forEach(dup => {
      console.log(`  • Wallet: ${dup.wallet.slice(0, 12)}...`);
      console.log(`    Rows: ${dup.indices.join(', ')}`);
      console.log(`    Names: ${dup.names.join(', ')}`);
    });

    if (report.duplicates.length > 10) {
      console.log(colorize(`  ... and ${report.duplicates.length - 10} more duplicates`, 'dim'));
    }

    if (!shouldFix) {
      console.log(colorize('\n  💡 Run with --fix to automatically remove duplicates', 'cyan'));
    }
  }

  // Print Warnings (if any, limited)
  if (report.warnings.length > 0 && report.errors.length === 0) {
    const missingEmailWarnings = report.warnings.filter(w => w.includes('No email'));

    if (missingEmailWarnings.length > 0 && missingEmailWarnings.length < report.warnings.length) {
      console.log('\n' + '─'.repeat(50));
      console.log(colorize(`  ⚠️  WARNINGS (${report.warnings.length})`, 'yellow'));
      console.log('─'.repeat(50));

      // Show non-email warnings
      const otherWarnings = report.warnings.filter(w => !w.includes('No email'));
      otherWarnings.slice(0, 10).forEach(warn => {
        console.log(`  • ${warn}`);
      });

      if (missingEmailWarnings.length > 0) {
        console.log(colorize(`  • ${missingEmailWarnings.length} entries have no email (will skip notification)`, 'dim'));
      }
    }
  }

  // Final Result
  console.log('\n' + '═'.repeat(50));

  const isValid = report.errors.length === 0 && report.duplicates.length === 0;

  if (isValid) {
    console.log(colorize('  ✅ VALIDATION PASSED', 'green'));
    console.log('═'.repeat(50));
    console.log(colorize('\n  Ready to mint! Run:', 'white'));
    console.log(colorize('  npm run upload', 'cyan'));
    console.log('');
    process.exit(0);
  } else {
    console.log(colorize('  ❌ VALIDATION FAILED', 'red'));
    console.log('═'.repeat(50));

    if (report.errors.length > 0) {
      console.log(colorize('\n  Fix the errors above before minting.', 'white'));
    }

    if (report.duplicates.length > 0 && !shouldFix) {
      console.log(colorize('\n  To auto-remove duplicates, run:', 'white'));
      console.log(colorize('  node scripts/0-validate-data.js --fix', 'cyan'));
    }

    console.log('');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(colorize(`\n❌ Unexpected error: ${err.message}`, 'red'));
  process.exit(1);
});
