import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// File paths
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const RESULTS_DIR = path.join(PROJECT_ROOT, 'results');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');

const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const PARTICIPANTS_PATH = path.join(DATA_DIR, 'participants.json');
const BUILDERS_PATH = path.join(DATA_DIR, 'builders.json');

/**
 * Load and parse a JSON file
 * @param {string} filepath - Path to JSON file
 * @returns {object} Parsed JSON data
 */
export function loadJson(filepath) {
  const data = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(data);
}

/**
 * Save data as JSON file
 * @param {string} filepath - Path to save to
 * @param {object} data - Data to save
 */
export function saveJson(filepath, data) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

/**
 * Promise-based delay
 * @param {number} ms - Milliseconds to wait
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Shorten an address for display
 * @param {string} address - Full address
 * @param {number} chars - Characters to show on each side
 * @returns {string} Shortened address
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format date for logging
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Load project config from data/config.json
 * @returns {object|null} Config object or null if not exists
 */
export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }
  return loadJson(CONFIG_PATH);
}

/**
 * Save project config to data/config.json
 * @param {object} config - Config to save
 */
export function saveConfig(config) {
  saveJson(CONFIG_PATH, {
    ...config,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Load participants from data/participants.json
 * @returns {Array} Array of participant objects
 */
export function loadParticipants() {
  if (!fs.existsSync(PARTICIPANTS_PATH)) {
    console.error(`\n❌ Participants file not found: ${PARTICIPANTS_PATH}`);
    console.error('   Create data/participants.json with your participant data.\n');
    process.exit(1);
  }
  const data = loadJson(PARTICIPANTS_PATH);
  return data.participants || [];
}

/**
 * Load builders from data/builders.json
 * @returns {Array} Array of builder objects
 */
export function loadBuilders() {
  if (!fs.existsSync(BUILDERS_PATH)) {
    console.error(`\n❌ Builders file not found: ${BUILDERS_PATH}`);
    console.error('   Run verification first: node scripts/3-verify-builders.js\n');
    process.exit(1);
  }
  const data = loadJson(BUILDERS_PATH);
  return data.builders || [];
}

/**
 * Save builders to data/builders.json
 * @param {Array} builders - Array of builder objects
 */
export function saveBuilders(builders) {
  saveJson(BUILDERS_PATH, {
    builders,
    verifiedAt: new Date().toISOString()
  });
}

/**
 * Save results to results/ directory
 * @param {string} filename - Filename to save as
 * @param {object} results - Results data
 * @returns {string} Full path to saved file
 */
export function saveResults(filename, results) {
  const filepath = path.join(RESULTS_DIR, filename);
  saveJson(filepath, {
    ...results,
    savedAt: new Date().toISOString()
  });
  return filepath;
}

/**
 * Get path to asset file
 * @param {string} filename - Asset filename
 * @returns {string} Full path to asset
 */
export function getAssetPath(filename) {
  return path.join(ASSETS_DIR, filename);
}

/**
 * Check if asset file exists
 * @param {string} filename - Asset filename
 * @returns {boolean} True if exists
 */
export function assetExists(filename) {
  return fs.existsSync(getAssetPath(filename));
}

/**
 * Read asset file as buffer
 * @param {string} filename - Asset filename
 * @returns {Buffer} File contents
 */
export function readAsset(filename) {
  return fs.readFileSync(getAssetPath(filename));
}

/**
 * Validate a Solana wallet address (basic check)
 * @param {string} address - Address to validate
 * @returns {boolean} True if appears valid
 */
export function isValidSolanaAddress(address) {
  if (!address || typeof address !== 'string') return false;
  // Base58 characters only, 32-44 characters
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Print a header banner
 * @param {string} title - Title to display
 * @param {object} info - Key-value pairs to display
 */
export function printHeader(title, info = {}) {
  console.log(`\n${title}`);
  console.log('='.repeat(50));
  for (const [key, value] of Object.entries(info)) {
    console.log(`${key}: ${value}`);
  }
  console.log('='.repeat(50));
}

/**
 * Print a summary section
 * @param {string} title - Section title
 * @param {object} stats - Stats to display
 */
export function printSummary(title, stats = {}) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(title);
  console.log('='.repeat(50));
  for (const [key, value] of Object.entries(stats)) {
    console.log(`${key}: ${value}`);
  }
}

/**
 * Simple readline prompt for yes/no confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} True if yes
 */
export async function confirm(question) {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${question} (y/n): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export {
  PROJECT_ROOT,
  DATA_DIR,
  RESULTS_DIR,
  ASSETS_DIR,
  CONFIG_PATH,
  PARTICIPANTS_PATH,
  BUILDERS_PATH
};
