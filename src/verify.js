import { Connection, PublicKey } from '@solana/web3.js';
import { getConfig } from './config.js';
import { loadParticipants, saveBuilders, isValidSolanaAddress, delay } from './utils.js';

/**
 * Check a wallet's on-chain activity within a date range
 * @param {Connection} connection - Solana connection
 * @param {string} walletAddress - Wallet to check
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<{isBuilder: boolean, transactionCount: number, firstTx: string|null}>}
 */
export async function checkWalletActivity(connection, walletAddress, startDate, endDate) {
  // Validate address
  if (!isValidSolanaAddress(walletAddress)) {
    return { isBuilder: false, transactionCount: 0, firstTx: null, error: 'Invalid address' };
  }

  try {
    const pubkey = new PublicKey(walletAddress);

    // Get transaction signatures for wallet
    const signatures = await connection.getSignaturesForAddress(pubkey, {
      limit: 100 // Check up to 100 recent transactions
    });

    if (!signatures || signatures.length === 0) {
      return { isBuilder: false, transactionCount: 0, firstTx: null };
    }

    // Filter by date range
    const startTime = startDate.getTime() / 1000; // Convert to seconds
    const endTime = endDate.getTime() / 1000;

    const relevantTxs = signatures.filter(sig => {
      if (!sig.blockTime) return false;
      return sig.blockTime >= startTime && sig.blockTime <= endTime;
    });

    const transactionCount = relevantTxs.length;
    const firstTx = relevantTxs.length > 0 ? relevantTxs[relevantTxs.length - 1].signature : null;

    return {
      isBuilder: transactionCount > 0,
      transactionCount,
      firstTx
    };
  } catch (error) {
    return {
      isBuilder: false,
      transactionCount: 0,
      firstTx: null,
      error: error.message
    };
  }
}

/**
 * Verify all participants for builder status
 * @param {Array} participants - Array of participant objects (optional, loads from file if not provided)
 * @param {Date} startDate - Start of verification period (optional)
 * @param {Date} endDate - End of verification period (optional)
 * @param {function} onProgress - Progress callback (current, total, result)
 * @returns {Promise<{builders: Array, nonBuilders: Array}>}
 */
export async function verifyAllParticipants(participants = null, startDate = null, endDate = null, onProgress = null) {
  const config = getConfig();

  // Load participants if not provided
  if (!participants) {
    participants = loadParticipants();
  }

  // Use config dates if not provided
  if (!startDate) startDate = config.tourStartDate;
  if (!endDate) endDate = config.tourEndDate;

  // Create connection
  const connection = new Connection(config.rpcUrl, 'confirmed');

  const builders = [];
  const nonBuilders = [];
  const total = participants.length;

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    const current = i + 1;

    const result = await checkWalletActivity(
      connection,
      participant.wallet,
      startDate,
      endDate
    );

    if (result.isBuilder) {
      builders.push({
        ...participant,
        transactionCount: result.transactionCount,
        firstTx: result.firstTx
      });

      if (onProgress) {
        onProgress(current, total, {
          isBuilder: true,
          participant,
          transactionCount: result.transactionCount
        });
      }
    } else {
      nonBuilders.push({
        ...participant,
        error: result.error || null
      });

      if (onProgress) {
        onProgress(current, total, {
          isBuilder: false,
          participant,
          error: result.error
        });
      }
    }

    // Add delay to avoid rate limiting
    if (i < participants.length - 1) {
      await delay(200);
    }
  }

  // Save builders
  saveBuilders(builders);

  return { builders, nonBuilders };
}

/**
 * Create a Solana connection from config
 * @returns {Connection} Solana connection
 */
export function createConnection() {
  const config = getConfig();
  return new Connection(config.rpcUrl, 'confirmed');
}
