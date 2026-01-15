#!/usr/bin/env node

/**
 * Identify builders by Program ID from wallets.csv
 * Anyone with a non-Nil Program ID is considered a builder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    header.forEach((key, i) => obj[key.trim()] = (values[i] || '').trim());
    return obj;
  });
}

// Load wallets.csv
const walletData = parseCSV(fs.readFileSync(path.join(__dirname, '..', 'raw-data', 'wallets.csv'), 'utf-8'));

// Find entries with Program ID (not 'Nil' or empty)
const withProgramId = walletData.filter(w => {
  const pid = w['Program ID'];
  return pid && pid.toLowerCase() !== 'nil' && pid !== '';
});

console.log('Total in wallets.csv:', walletData.length);
console.log('With Program ID (builders):', withProgramId.length);

// Load participants
const participants = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'participants.json'), 'utf-8')).participants;

// Create wallet lookup from participants
const participantsByWallet = new Map();
participants.forEach(p => participantsByWallet.set(p.wallet, p));

// Match builders to participants
const builders = [];
withProgramId.forEach(w => {
  const wallet = w['Devnet Wallet Address'];
  const participant = participantsByWallet.get(wallet);
  if (participant) {
    builders.push({
      ...participant,
      programId: w['Program ID'],
      github: w['Github profile'] || ''
    });
  }
});

console.log('Matched to participants:', builders.length);

// Save builders.json
fs.writeFileSync(path.join(__dirname, '..', 'data', 'builders.json'), JSON.stringify({
  builders,
  verifiedAt: new Date().toISOString(),
  method: 'program-id'
}, null, 2));

console.log('\nBuilders saved to data/builders.json');

// Count with/without email
const withEmail = builders.filter(b => b.email).length;
console.log('\nBuilders with email:', withEmail);
console.log('Builders without email:', builders.length - withEmail);
