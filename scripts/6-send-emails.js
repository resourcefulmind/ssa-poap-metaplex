#!/usr/bin/env node

/**
 * Script 6: Send email notifications to POAP recipients
 *
 * This script sends emails to participants and builders after minting.
 * Run this after scripts 4 and 5 have completed.
 *
 * Usage:
 *   node scripts/6-send-emails.js                    # Send all pending emails
 *   node scripts/6-send-emails.js --participation   # Send only participation emails
 *   node scripts/6-send-emails.js --builders        # Send only builder emails
 *   node scripts/6-send-emails.js --retry           # Retry failed emails only
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendBatchEmails, validateEmailConfig } from '../src/email.js';
import { participationEmailTemplate, builderEmailTemplate } from '../src/email-templates.js';
import {
  loadJson,
  saveJson,
  loadConfig,
  printHeader,
  printSummary,
  confirm,
  shortenAddress,
  RESULTS_DIR,
} from '../src/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find the most recent results file of a given type
 */
function findLatestResultsFile(type) {
  if (!fs.existsSync(RESULTS_DIR)) return null;

  const files = fs.readdirSync(RESULTS_DIR)
    .filter(f => f.startsWith(type) && f.endsWith('.json'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(RESULTS_DIR, files[0]) : null;
}

/**
 * Load email tracking file
 */
function loadEmailTracking() {
  const trackingPath = path.join(RESULTS_DIR, 'email-tracking.json');
  if (fs.existsSync(trackingPath)) {
    return loadJson(trackingPath);
  }
  return { sent: [], failed: [] };
}

/**
 * Save email tracking file
 */
function saveEmailTracking(tracking) {
  const trackingPath = path.join(RESULTS_DIR, 'email-tracking.json');
  saveJson(trackingPath, {
    ...tracking,
    updatedAt: new Date().toISOString(),
  });
  return trackingPath;
}

/**
 * Prepare emails from mint results
 */
function prepareEmails(results, type, network, poapImageUrl) {
  const emails = [];

  for (const recipient of results) {
    // Skip if no email address
    if (!recipient.email) continue;

    const templateFn = type === 'participation' ? participationEmailTemplate : builderEmailTemplate;
    const template = templateFn({
      name: recipient.name,
      wallet: recipient.wallet,
      network,
      transactionCount: recipient.transactionCount,
      poapImageUrl,
    });

    emails.push({
      email: recipient.email,
      subject: template.subject,
      html: template.html,
      metadata: {
        type,
        name: recipient.name,
        wallet: recipient.wallet,
      },
    });
  }

  return emails;
}

async function main() {
  const args = process.argv.slice(2);
  const participationOnly = args.includes('--participation');
  const buildersOnly = args.includes('--builders');
  const retryOnly = args.includes('--retry');

  console.log('\n📧 SSA POAP Email Notifications');

  // Validate email config
  const configErrors = validateEmailConfig();
  if (configErrors.some(e => e.includes('RESEND_API_KEY'))) {
    console.error('\n❌ Email configuration error:');
    configErrors.forEach(e => console.error(`   - ${e}`));
    console.error('\n   Add RESEND_API_KEY to your .env file.\n');
    process.exit(1);
  }

  const network = process.env.NETWORK || 'devnet';

  // Load project config (for POAP image URLs)
  const projectConfig = loadConfig();
  const participationImageUrl = projectConfig?.participation?.imageUri || '';
  const builderImageUrl = projectConfig?.builder?.imageUri || '';

  // Load email tracking
  const tracking = loadEmailTracking();
  const alreadySent = new Set(tracking.sent.map(s => `${s.type}:${s.email}`));

  let allEmails = [];

  // Handle retry mode
  if (retryOnly) {
    if (tracking.failed.length === 0) {
      console.log('\n✅ No failed emails to retry.\n');
      process.exit(0);
    }

    console.log(`\n📋 Found ${tracking.failed.length} failed emails to retry.`);
    allEmails = tracking.failed.map(f => ({
      email: f.email,
      subject: f.type === 'participation'
        ? participationEmailTemplate({ name: f.name, wallet: f.wallet, network, poapImageUrl: participationImageUrl }).subject
        : builderEmailTemplate({ name: f.name, wallet: f.wallet, network, poapImageUrl: builderImageUrl }).subject,
      html: f.type === 'participation'
        ? participationEmailTemplate({ name: f.name, wallet: f.wallet, network, poapImageUrl: participationImageUrl }).html
        : builderEmailTemplate({ name: f.name, wallet: f.wallet, network, poapImageUrl: builderImageUrl }).html,
      metadata: { type: f.type, name: f.name, wallet: f.wallet },
    }));

    // Clear failed list since we're retrying
    tracking.failed = [];
  } else {
    // Load participation results
    if (!buildersOnly) {
      const participationFile = findLatestResultsFile('participation');
      if (participationFile) {
        const data = loadJson(participationFile);
        const emails = prepareEmails(data.successful || [], 'participation', network, participationImageUrl)
          .filter(e => !alreadySent.has(`participation:${e.email}`));
        allEmails.push(...emails);
        console.log(`\n📄 Participation: ${emails.length} emails to send`);
      } else {
        console.log('\n⚠️  No participation results found. Run mint-participation first.');
      }
    }

    // Load builder results
    if (!participationOnly) {
      const buildersFile = findLatestResultsFile('builders');
      if (buildersFile) {
        const data = loadJson(buildersFile);
        const emails = prepareEmails(data.successful || [], 'builder', network, builderImageUrl)
          .filter(e => !alreadySent.has(`builder:${e.email}`));
        allEmails.push(...emails);
        console.log(`📄 Builders: ${emails.length} emails to send`);
      } else {
        console.log('\n⚠️  No builder results found. Run mint-builders first.');
      }
    }
  }

  if (allEmails.length === 0) {
    console.log('\n✅ No new emails to send. All recipients already notified.\n');
    process.exit(0);
  }

  printHeader('', {
    'Network': network,
    'Emails to send': allEmails.length,
    'Already sent': tracking.sent.length,
  });

  // Confirm
  const proceed = await confirm('\nSend emails now?');
  if (!proceed) {
    console.log('\n❌ Cancelled.\n');
    process.exit(0);
  }

  console.log('\n📤 Sending emails...\n');

  // Progress callback
  const onProgress = (current, total, result) => {
    if (result.success) {
      console.log(`[${current}/${total}] ✅ ${result.email}`);
    } else {
      console.log(`[${current}/${total}] ❌ ${result.email} - ${result.error}`);
    }
  };

  // Send emails
  const startTime = Date.now();
  const { sent, failed } = await sendBatchEmails(allEmails, onProgress);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Update tracking
  tracking.sent.push(...sent);
  tracking.failed.push(...failed);
  const trackingPath = saveEmailTracking(tracking);

  printSummary('📊 EMAIL SUMMARY', {
    '✅ Sent': sent.length,
    '❌ Failed': failed.length,
    'Duration': `${duration}s`,
    'Total sent (all time)': tracking.sent.length,
  });

  console.log(`\n💾 Tracking saved to ${trackingPath}`);

  if (failed.length > 0) {
    console.log('\n⚠️  Some emails failed. Run with --retry to retry them:');
    console.log('   node scripts/6-send-emails.js --retry');
  }

  console.log('\n✨ Email notifications complete!\n');
}

main().catch(console.error);
