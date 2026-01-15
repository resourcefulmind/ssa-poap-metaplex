import { publicKey } from '@metaplex-foundation/umi';
import { mintV1 } from '@metaplex-foundation/mpl-bubblegum';
import { delay, isValidSolanaAddress } from './utils.js';

/**
 * Mint a compressed NFT to a recipient
 * @param {import('@metaplex-foundation/umi').Umi} umi - Umi instance
 * @param {string} treeAddress - Merkle tree public key
 * @param {string} metadataUri - URI to NFT metadata
 * @param {string} recipient - Recipient wallet address
 * @param {object} metadata - NFT metadata (name, symbol)
 * @returns {Promise<{signature: string}>} Transaction signature
 */
export async function mintCompressedNFT(umi, treeAddress, metadataUri, recipient, metadata = {}) {
  // Validate recipient address
  if (!isValidSolanaAddress(recipient)) {
    throw new Error(`Invalid wallet address: ${recipient}`);
  }

  const builder = mintV1(umi, {
    leafOwner: publicKey(recipient),
    merkleTree: publicKey(treeAddress),
    metadata: {
      name: metadata.name || 'SSA POAP',
      symbol: metadata.symbol || 'SSAP',
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      collection: null,
      creators: []
    }
  });

  const result = await builder.sendAndConfirm(umi);

  return {
    signature: Buffer.from(result.signature).toString('base64')
  };
}

/**
 * Mint compressed NFTs to multiple recipients
 * @param {import('@metaplex-foundation/umi').Umi} umi - Umi instance
 * @param {string} treeAddress - Merkle tree public key
 * @param {string} metadataUri - URI to NFT metadata
 * @param {Array<{wallet: string, name?: string}>} recipients - Array of recipient objects
 * @param {object} metadata - NFT metadata (name, symbol)
 * @param {function} onProgress - Progress callback (current, total, result)
 * @returns {Promise<{successful: Array, failed: Array}>} Results
 */
export async function mintToMany(umi, treeAddress, metadataUri, recipients, metadata = {}, onProgress = null) {
  const successful = [];
  const failed = [];
  const total = recipients.length;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const current = i + 1;

    try {
      const result = await mintCompressedNFT(
        umi,
        treeAddress,
        metadataUri,
        recipient.wallet,
        metadata
      );

      successful.push({
        ...recipient,
        signature: result.signature,
        mintedAt: new Date().toISOString()
      });

      if (onProgress) {
        onProgress(current, total, { success: true, recipient, signature: result.signature });
      }
    } catch (error) {
      failed.push({
        ...recipient,
        error: error.message,
        failedAt: new Date().toISOString()
      });

      if (onProgress) {
        onProgress(current, total, { success: false, recipient, error: error.message });
      }
    }

    // Add delay between mints to avoid rate limiting
    if (i < recipients.length - 1) {
      await delay(500);
    }
  }

  return { successful, failed };
}

/**
 * Resume minting from a previous results file
 * Skips recipients that were already successfully minted
 * @param {import('@metaplex-foundation/umi').Umi} umi - Umi instance
 * @param {string} treeAddress - Merkle tree public key
 * @param {string} metadataUri - URI to NFT metadata
 * @param {Array} recipients - All recipients
 * @param {Array} previousSuccessful - Previously successful mints
 * @param {object} metadata - NFT metadata
 * @param {function} onProgress - Progress callback
 * @returns {Promise<{successful: Array, failed: Array}>} Combined results
 */
export async function resumeMinting(umi, treeAddress, metadataUri, recipients, previousSuccessful, metadata = {}, onProgress = null) {
  // Create set of already-minted wallets
  const mintedWallets = new Set(previousSuccessful.map(p => p.wallet));

  // Filter to only unminted recipients
  const remaining = recipients.filter(r => !mintedWallets.has(r.wallet));

  console.log(`\n📋 Resuming: ${previousSuccessful.length} already minted, ${remaining.length} remaining\n`);

  // Mint remaining
  const { successful, failed } = await mintToMany(
    umi,
    treeAddress,
    metadataUri,
    remaining,
    metadata,
    onProgress
  );

  // Combine with previous successful
  return {
    successful: [...previousSuccessful, ...successful],
    failed
  };
}
