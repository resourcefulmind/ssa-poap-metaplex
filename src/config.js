import 'dotenv/config';
import bs58 from 'bs58';

/**
 * Configuration loader and validator
 */

const VALID_NETWORKS = ['devnet', 'mainnet-beta'];

const DEFAULT_RPC_URLS = {
  'devnet': 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com'
};

const IRYS_URLS = {
  'devnet': 'https://devnet.irys.xyz',
  'mainnet-beta': 'https://node1.irys.xyz'
};

/**
 * Validate that all required configuration is present and valid
 */
export function validateConfig() {
  const errors = [];

  // Validate NETWORK
  const network = process.env.NETWORK;
  if (!network) {
    errors.push('NETWORK is required. Set to "devnet" or "mainnet-beta"');
  } else if (!VALID_NETWORKS.includes(network)) {
    errors.push(`NETWORK must be one of: ${VALID_NETWORKS.join(', ')}`);
  }

  // Validate PRIVATE_KEY
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    errors.push('PRIVATE_KEY is required. Export from your wallet.');
  } else {
    try {
      const decoded = bs58.decode(privateKey);
      if (decoded.length !== 64) {
        errors.push('PRIVATE_KEY must be a 64-byte ed25519 secret key (base58 encoded)');
      }
    } catch (e) {
      errors.push('PRIVATE_KEY is not valid base58');
    }
  }

  // Validate tour dates if provided
  const startDate = process.env.TOUR_START_DATE;
  const endDate = process.env.TOUR_END_DATE;

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push('TOUR_START_DATE is not a valid date (use ISO format: YYYY-MM-DD)');
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push('TOUR_END_DATE is not a valid date (use ISO format: YYYY-MM-DD)');
  }

  if (errors.length > 0) {
    console.error('\n❌ Configuration errors:\n');
    errors.forEach(err => console.error(`   - ${err}`));
    console.error('\n   Check your .env file and try again.\n');
    process.exit(1);
  }
}

/**
 * Get the current configuration
 */
export function getConfig() {
  const network = process.env.NETWORK || 'devnet';

  return {
    network,
    privateKey: process.env.PRIVATE_KEY,
    rpcUrl: process.env.RPC_URL || DEFAULT_RPC_URLS[network],
    irysUrl: IRYS_URLS[network],
    tourStartDate: process.env.TOUR_START_DATE ? new Date(process.env.TOUR_START_DATE) : new Date('2025-01-01'),
    tourEndDate: process.env.TOUR_END_DATE ? new Date(process.env.TOUR_END_DATE) : new Date('2025-12-31'),
  };
}

export const config = {
  get network() { return getConfig().network; },
  get privateKey() { return getConfig().privateKey; },
  get rpcUrl() { return getConfig().rpcUrl; },
  get irysUrl() { return getConfig().irysUrl; },
  get tourStartDate() { return getConfig().tourStartDate; },
  get tourEndDate() { return getConfig().tourEndDate; },
};

export default config;
