#!/usr/bin/env node

/**
 * Data Consolidation Script
 *
 * Merges participant data from multiple sources:
 * - Luma CSVs (registration data with emails)
 * - Google Sheet export (wallet addresses)
 *
 * Output:
 * - data/participants.json (master list for minting)
 * - raw-data/reports/*.csv (review files)
 *
 * Usage:
 *   node scripts/consolidate-data.js
 *
 * Expected file naming:
 *   raw-data/wallets.csv           - Google Sheet export
 *   raw-data/luma-{campus}-day{n}.csv - Luma exports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const RAW_DATA_DIR = path.join(ROOT_DIR, 'raw-data');
const REPORTS_DIR = path.join(RAW_DATA_DIR, 'reports');
const DATA_DIR = path.join(ROOT_DIR, 'data');

// ANSI colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Parse a CSV string into array of objects
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header - handle quoted fields
  const header = parseCSVLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row = {};
    header.forEach((key, index) => {
      row[key.trim()] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
function similarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Simple Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

/**
 * Normalize a name for matching
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/[^a-z\s]/g, ''); // Remove non-alpha chars
}

/**
 * Extract campus name from filename
 * e.g., "luma-unilag-day1.csv" -> "UNILAG"
 */
function extractCampus(filename) {
  const match = filename.match(/luma-([^-]+)-/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return 'UNKNOWN';
}

/**
 * Convert array of objects to CSV string
 */
function toCSV(data, columns) {
  if (data.length === 0) return '';

  const header = columns.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const val = String(row[col] ?? '');
      // Escape quotes and wrap in quotes if contains comma
      if (val.includes(',') || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

async function main() {
  console.log(`\n${colorize('📊 SSA POAP Data Consolidation', 'cyan')}`);
  console.log('='.repeat(50));

  // Check raw-data directory exists
  if (!fs.existsSync(RAW_DATA_DIR)) {
    console.error(colorize('\n❌ raw-data/ directory not found!', 'red'));
    console.error('   Create raw-data/ and add your CSV files.\n');
    process.exit(1);
  }

  // Create reports directory
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // Find all CSV files
  const files = fs.readdirSync(RAW_DATA_DIR).filter(f => f.endsWith('.csv'));

  if (files.length === 0) {
    console.error(colorize('\n❌ No CSV files found in raw-data/', 'red'));
    console.error('   Add wallets.csv and luma-*.csv files.\n');
    process.exit(1);
  }

  // Separate wallet file from Luma files
  const walletFile = files.find(f => f.toLowerCase().includes('wallet'));
  const lumaFiles = files.filter(f => f.toLowerCase().includes('luma'));

  if (!walletFile) {
    console.error(colorize('\n❌ wallets.csv not found!', 'red'));
    console.error('   Export your Google Sheet as wallets.csv\n');
    process.exit(1);
  }

  if (lumaFiles.length === 0) {
    console.error(colorize('\n❌ No Luma files found!', 'red'));
    console.error('   Add luma-{campus}-day{n}.csv files\n');
    process.exit(1);
  }

  console.log(`\n${colorize('📁 Found files:', 'white')}`);
  console.log(`   Wallet file: ${walletFile}`);
  console.log(`   Luma files: ${lumaFiles.length}`);
  lumaFiles.forEach(f => console.log(`     - ${f}`));

  // ============================================
  // STEP 1: Load wallet data (Google Sheet)
  // ============================================
  console.log(colorize('\n📥 Loading wallet data...', 'cyan'));

  const walletContent = fs.readFileSync(path.join(RAW_DATA_DIR, walletFile), 'utf-8');
  const walletRows = parseCSV(walletContent);

  // Map by normalized name for matching
  const walletsByName = new Map();
  const walletData = [];

  for (const row of walletRows) {
    // Handle different possible column names
    const name = row['Full Name'] || row['name'] || row['Name'] || '';
    const wallet = row['Devnet Wallet Address'] || row['Devnet wallet address'] || row['wallet'] || row['Wallet'] || '';
    const programId = row['Program ID'] || row['program_id'] || '';
    const github = row['Github profile'] || row['github'] || row['GitHub'] || '';

    if (!name || !wallet || wallet.toLowerCase() === 'nil') continue;

    const normalizedName = normalizeName(name);
    walletData.push({
      name: name.trim(),
      normalizedName,
      wallet: wallet.trim(),
      programId: programId.trim(),
      github: github.trim()
    });

    // Store by normalized name (handle duplicates by keeping first)
    if (!walletsByName.has(normalizedName)) {
      walletsByName.set(normalizedName, walletData[walletData.length - 1]);
    }
  }

  console.log(`   Loaded ${walletData.length} wallet entries`);

  // ============================================
  // STEP 2: Load Luma data (registrations)
  // ============================================
  console.log(colorize('\n📥 Loading Luma registrations...', 'cyan'));

  // Collect all registrations, dedupe by email
  const registrationsByEmail = new Map();

  for (const lumaFile of lumaFiles) {
    const campus = extractCampus(lumaFile);
    const content = fs.readFileSync(path.join(RAW_DATA_DIR, lumaFile), 'utf-8');
    const rows = parseCSV(content);

    console.log(`   ${lumaFile}: ${rows.length} entries (${campus})`);

    for (const row of rows) {
      const email = (row['email'] || row['Email'] || '').trim().toLowerCase();
      const firstName = row['first_name'] || row['First Name'] || '';
      const lastName = row['last_name'] || row['Last Name'] || '';
      const fullName = row['name'] || row['Name'] || `${firstName} ${lastName}`.trim();
      const checkedIn = row['checked_in_at'] || row['Checked In'] || '';
      const status = row['approval_status'] || row['Status'] || '';

      if (!email) continue;

      // Only count approved/checked-in attendees
      const attended = checkedIn !== '' || status === 'approved';

      if (registrationsByEmail.has(email)) {
        // Update existing - add campus if new
        const existing = registrationsByEmail.get(email);
        if (!existing.campuses.includes(campus)) {
          existing.campuses.push(campus);
        }
        existing.daysAttended++;
      } else {
        registrationsByEmail.set(email, {
          name: fullName.trim(),
          normalizedName: normalizeName(fullName),
          email,
          campuses: [campus],
          daysAttended: 1,
          attended
        });
      }
    }
  }

  console.log(`   Total unique registrations: ${registrationsByEmail.size}`);

  // ============================================
  // STEP 3: Match registrations to wallets
  // ============================================
  console.log(colorize('\n🔗 Matching registrations to wallets...', 'cyan'));

  const FUZZY_THRESHOLD = 0.85;

  const matched = [];          // Successfully matched
  const reviewNeeded = [];     // Low confidence matches
  const missingWallets = [];   // In Luma, no wallet found
  const usedWallets = new Set(); // Track which wallets have been matched

  for (const [email, reg] of registrationsByEmail) {
    // Try exact match first
    let walletEntry = walletsByName.get(reg.normalizedName);
    let matchConfidence = walletEntry ? 1.0 : 0;
    let matchMethod = 'exact';

    // If no exact match, try fuzzy matching
    if (!walletEntry) {
      let bestMatch = null;
      let bestScore = 0;

      for (const [normalizedName, entry] of walletsByName) {
        if (usedWallets.has(entry.wallet)) continue; // Skip already matched

        const score = similarity(reg.normalizedName, normalizedName);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }

      if (bestMatch && bestScore >= FUZZY_THRESHOLD) {
        walletEntry = bestMatch;
        matchConfidence = bestScore;
        matchMethod = 'fuzzy';
      } else if (bestMatch && bestScore >= 0.7) {
        // Low confidence - flag for review
        reviewNeeded.push({
          lumaName: reg.name,
          lumaEmail: email,
          suggestedMatch: bestMatch.name,
          suggestedWallet: bestMatch.wallet,
          confidence: (bestScore * 100).toFixed(1) + '%',
          campuses: reg.campuses.join(', ')
        });
        continue;
      }
    }

    if (walletEntry) {
      matched.push({
        name: reg.name || walletEntry.name,
        wallet: walletEntry.wallet,
        email: email,
        campus: reg.campuses[0],
        campuses: reg.campuses.join(', '),
        daysAttended: reg.daysAttended,
        github: walletEntry.github,
        matchMethod,
        confidence: (matchConfidence * 100).toFixed(1) + '%'
      });
      usedWallets.add(walletEntry.wallet);
    } else {
      missingWallets.push({
        name: reg.name,
        email: email,
        campuses: reg.campuses.join(', '),
        daysAttended: reg.daysAttended
      });
    }
  }

  // Find wallets with no Luma registration
  const noEmail = [];
  for (const entry of walletData) {
    if (!usedWallets.has(entry.wallet)) {
      noEmail.push({
        name: entry.name,
        wallet: entry.wallet,
        github: entry.github,
        programId: entry.programId
      });
    }
  }

  // ============================================
  // STEP 4: Generate reports
  // ============================================
  console.log(colorize('\n📊 Results:', 'white'));
  console.log(`   ${colorize('✅ Matched:', 'green')} ${matched.length}`);
  console.log(`   ${colorize('⚠️  Review needed:', 'yellow')} ${reviewNeeded.length}`);
  console.log(`   ${colorize('📧 Missing wallets:', 'yellow')} ${missingWallets.length} (registered but no wallet)`);
  console.log(`   ${colorize('📭 No email:', 'yellow')} ${noEmail.length} (has wallet but no registration)`);

  // Save reports
  console.log(colorize('\n💾 Saving reports...', 'cyan'));

  // Matched report
  if (matched.length > 0) {
    const matchedCSV = toCSV(matched, ['name', 'wallet', 'email', 'campus', 'campuses', 'daysAttended', 'github', 'matchMethod', 'confidence']);
    fs.writeFileSync(path.join(REPORTS_DIR, 'matched.csv'), matchedCSV);
    console.log(`   ✓ ${REPORTS_DIR}/matched.csv`);
  }

  // Review needed report
  if (reviewNeeded.length > 0) {
    const reviewCSV = toCSV(reviewNeeded, ['lumaName', 'lumaEmail', 'suggestedMatch', 'suggestedWallet', 'confidence', 'campuses']);
    fs.writeFileSync(path.join(REPORTS_DIR, 'review-needed.csv'), reviewCSV);
    console.log(`   ✓ ${REPORTS_DIR}/review-needed.csv`);
  }

  // Missing wallets report
  if (missingWallets.length > 0) {
    const missingCSV = toCSV(missingWallets, ['name', 'email', 'campuses', 'daysAttended']);
    fs.writeFileSync(path.join(REPORTS_DIR, 'missing-wallets.csv'), missingCSV);
    console.log(`   ✓ ${REPORTS_DIR}/missing-wallets.csv`);
  }

  // No email report
  if (noEmail.length > 0) {
    const noEmailCSV = toCSV(noEmail, ['name', 'wallet', 'github', 'programId']);
    fs.writeFileSync(path.join(REPORTS_DIR, 'no-email.csv'), noEmailCSV);
    console.log(`   ✓ ${REPORTS_DIR}/no-email.csv`);
  }

  // ============================================
  // STEP 5: Generate participants.json
  // ============================================
  console.log(colorize('\n📝 Generating participants.json...', 'cyan'));

  // Combine matched + no-email (everyone with a valid wallet)
  const allParticipants = [
    ...matched.map(m => ({
      name: m.name,
      wallet: m.wallet,
      email: m.email,
      campus: m.campus
    })),
    ...noEmail.map(n => ({
      name: n.name,
      wallet: n.wallet,
      email: '', // No email - won't receive notification
      campus: 'WALK-IN' // Likely walk-ins or different registration
    }))
  ];

  // Save participants.json
  const participantsPath = path.join(DATA_DIR, 'participants.json');
  fs.writeFileSync(participantsPath, JSON.stringify({ participants: allParticipants }, null, 2));
  console.log(`   ✓ ${participantsPath}`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '═'.repeat(50));
  console.log(colorize('  📊 CONSOLIDATION SUMMARY', 'bold'));
  console.log('═'.repeat(50));
  console.log(`
  Total participants: ${colorize(allParticipants.length.toString(), 'green')}
    - With email:     ${colorize(matched.length.toString(), 'green')} (will receive notification)
    - Without email:  ${colorize(noEmail.length.toString(), 'yellow')} (no notification)

  Action needed:
    - Review needed:  ${colorize(reviewNeeded.length.toString(), 'yellow')} (check review-needed.csv)
    - Missing wallet: ${colorize(missingWallets.length.toString(), 'yellow')} (check missing-wallets.csv)
`);
  console.log('═'.repeat(50));

  if (reviewNeeded.length > 0) {
    console.log(colorize('\n⚠️  Review the matches in review-needed.csv', 'yellow'));
    console.log('   These are low-confidence matches that need manual verification.');
    console.log('   After review, you can manually add them to participants.json\n');
  }

  if (missingWallets.length > 0) {
    console.log(colorize('📧 Missing wallets:', 'yellow'));
    console.log('   These people registered but didn\'t submit a wallet address.');
    console.log('   Consider reaching out to collect their wallets.\n');
  }

  console.log(colorize('✅ Next steps:', 'green'));
  console.log('   1. Review the reports in raw-data/reports/');
  console.log('   2. Run: npm run validate');
  console.log('   3. Run: npm run mint-participation -- --dry-run\n');
}

main().catch(err => {
  console.error(colorize(`\n❌ Error: ${err.message}`, 'red'));
  process.exit(1);
});
