/**
 * Data validation utilities for participant data
 * Catches edge cases before minting to prevent failures and wasted resources
 */

/**
 * Validate a Solana wallet address
 * @param {string} address - Address to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateWalletAddress(address) {
  // Check if exists and is string
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Missing or invalid wallet address' };
  }

  // Trim and check for whitespace issues
  const trimmed = address.trim();
  if (trimmed !== address) {
    return { valid: false, error: 'Wallet address has leading/trailing whitespace' };
  }

  // Check length (Solana addresses are 32-44 characters in base58)
  if (address.length < 32 || address.length > 44) {
    return { valid: false, error: `Invalid length: ${address.length} chars (expected 32-44)` };
  }

  // Check for valid base58 characters only
  // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
  // (no 0, O, I, l to avoid confusion)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(address)) {
    return { valid: false, error: 'Contains invalid characters (not valid base58)' };
  }

  return { valid: true };
}

/**
 * Validate an email address (basic format check)
 * @param {string} email - Email to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateEmail(email) {
  // Empty/missing is valid (just means no notification)
  if (!email || email.trim() === '') {
    return { valid: true, missing: true };
  }

  // Basic email format regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate a single participant entry
 * @param {object} participant - Participant object
 * @param {number} index - Index in array (for error reporting)
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
export function validateParticipant(participant, index) {
  const errors = [];
  const warnings = [];
  const rowNum = index + 1;

  // Check wallet (required)
  if (!participant.wallet) {
    errors.push(`Row ${rowNum}: Missing wallet address`);
  } else {
    const walletCheck = validateWalletAddress(participant.wallet);
    if (!walletCheck.valid) {
      errors.push(`Row ${rowNum}: ${walletCheck.error} (wallet: "${participant.wallet}")`);
    }
  }

  // Check email (optional but validate if present)
  if (participant.email) {
    const emailCheck = validateEmail(participant.email);
    if (!emailCheck.valid) {
      warnings.push(`Row ${rowNum}: ${emailCheck.error} (email: "${participant.email}") - will skip email notification`);
    }
  } else {
    warnings.push(`Row ${rowNum}: No email address - will not receive notification`);
  }

  // Check name (optional but nice to have)
  if (!participant.name || participant.name.trim() === '') {
    warnings.push(`Row ${rowNum}: No name provided (wallet: ${participant.wallet?.slice(0, 8)}...)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Find duplicate wallet addresses
 * @param {Array} participants - Array of participant objects
 * @returns {Array<{wallet: string, indices: number[], names: string[]}>} Duplicates found
 */
export function findDuplicates(participants) {
  const walletMap = new Map();

  // Group by wallet address
  participants.forEach((p, index) => {
    if (!p.wallet) return;

    const wallet = p.wallet.trim().toLowerCase();
    if (!walletMap.has(wallet)) {
      walletMap.set(wallet, {
        originalWallet: p.wallet,
        indices: [],
        names: []
      });
    }
    walletMap.get(wallet).indices.push(index + 1); // 1-indexed for readability
    walletMap.get(wallet).names.push(p.name || 'Unknown');
  });

  // Filter to only duplicates (more than one occurrence)
  const duplicates = [];
  for (const [wallet, data] of walletMap) {
    if (data.indices.length > 1) {
      duplicates.push({
        wallet: data.originalWallet,
        indices: data.indices,
        names: data.names
      });
    }
  }

  return duplicates;
}

/**
 * Validate all participants and return comprehensive report
 * @param {Array} participants - Array of participant objects
 * @returns {object} Validation report
 */
export function validateAllParticipants(participants) {
  const report = {
    total: participants.length,
    valid: 0,
    invalid: 0,
    errors: [],
    warnings: [],
    duplicates: [],
    withEmail: 0,
    withoutEmail: 0,
    summary: {}
  };

  if (!Array.isArray(participants) || participants.length === 0) {
    report.errors.push('No participants found or invalid data format');
    return report;
  }

  // Validate each participant
  participants.forEach((participant, index) => {
    const result = validateParticipant(participant, index);

    if (result.valid) {
      report.valid++;
    } else {
      report.invalid++;
    }

    report.errors.push(...result.errors);
    report.warnings.push(...result.warnings);

    // Track email coverage
    if (participant.email && participant.email.trim() !== '') {
      report.withEmail++;
    } else {
      report.withoutEmail++;
    }
  });

  // Find duplicates
  report.duplicates = findDuplicates(participants);

  // Generate summary
  report.summary = {
    totalEntries: report.total,
    validEntries: report.valid,
    invalidEntries: report.invalid,
    duplicateWallets: report.duplicates.length,
    withEmail: report.withEmail,
    withoutEmail: report.withoutEmail,
    errorCount: report.errors.length,
    warningCount: report.warnings.length
  };

  return report;
}

/**
 * Remove duplicate entries (keeps first occurrence)
 * @param {Array} participants - Array of participant objects
 * @returns {Array} Deduplicated array
 */
export function removeDuplicates(participants) {
  const seen = new Set();
  return participants.filter(p => {
    if (!p.wallet) return false;
    const wallet = p.wallet.trim().toLowerCase();
    if (seen.has(wallet)) return false;
    seen.add(wallet);
    return true;
  });
}

/**
 * Clean participant data (trim whitespace, fix common issues)
 * @param {Array} participants - Array of participant objects
 * @returns {Array} Cleaned array
 */
export function cleanParticipantData(participants) {
  return participants.map(p => ({
    ...p,
    wallet: p.wallet?.trim() || '',
    email: p.email?.trim() || '',
    name: p.name?.trim() || '',
    campus: p.campus?.trim() || ''
  }));
}

/**
 * Filter to only valid participants
 * @param {Array} participants - Array of participant objects
 * @returns {{valid: Array, invalid: Array}} Separated arrays
 */
export function separateValidInvalid(participants) {
  const valid = [];
  const invalid = [];

  participants.forEach((p, index) => {
    const result = validateParticipant(p, index);
    if (result.valid) {
      valid.push(p);
    } else {
      invalid.push({ ...p, errors: result.errors });
    }
  });

  return { valid, invalid };
}

export default {
  validateWalletAddress,
  validateEmail,
  validateParticipant,
  validateAllParticipants,
  findDuplicates,
  removeDuplicates,
  cleanParticipantData,
  separateValidInvalid
};
