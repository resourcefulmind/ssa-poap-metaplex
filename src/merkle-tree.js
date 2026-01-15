import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import { createTree } from '@metaplex-foundation/mpl-bubblegum';
import { loadConfig, saveConfig } from './utils.js';

/**
 * Default tree parameters
 * maxDepth: 10 = 2^10 = 1,024 possible leaves (enough for ~200 participants)
 * maxBufferSize: 32 = concurrent updates allowed
 *
 * Cost-saving: Smaller trees are much cheaper!
 * - Depth 14 (16k capacity): ~3.85 SOL per tree
 * - Depth 10 (1k capacity): ~0.15 SOL per tree
 */
const DEFAULT_MAX_DEPTH = 9;
const DEFAULT_MAX_BUFFER_SIZE = 16;

/**
 * Create a new Merkle tree for compressed NFTs
 * @param {import('@metaplex-foundation/umi').Umi} umi - Umi instance
 * @param {number} maxDepth - Maximum tree depth (default: 14)
 * @param {number} maxBufferSize - Maximum buffer size (default: 64)
 * @returns {Promise<{address: string, signature: string}>} Tree address and tx signature
 */
export async function createMerkleTree(umi, maxDepth = DEFAULT_MAX_DEPTH, maxBufferSize = DEFAULT_MAX_BUFFER_SIZE) {
  // Generate a new keypair for the tree
  const merkleTree = generateSigner(umi);

  // Create the tree
  const builder = await createTree(umi, {
    merkleTree,
    maxDepth,
    maxBufferSize,
  });

  // Send and confirm transaction
  const result = await builder.sendAndConfirm(umi);

  return {
    address: merkleTree.publicKey.toString(),
    signature: Buffer.from(result.signature).toString('base64')
  };
}

/**
 * Create Merkle trees for both POAP tiers
 * @param {import('@metaplex-foundation/umi').Umi} umi - Umi instance
 * @returns {Promise<object>} Updated config with tree addresses
 */
export async function createBothTrees(umi) {
  const config = loadConfig();

  if (!config) {
    throw new Error('Config not found. Run upload-assets first.');
  }

  console.log('\n🌳 Creating Participation tree...');
  const participationTree = await createMerkleTree(umi);
  console.log(`   ✅ Address: ${participationTree.address}`);

  console.log('\n🌳 Creating Builder tree...');
  const builderTree = await createMerkleTree(umi);
  console.log(`   ✅ Address: ${builderTree.address}`);

  // Update config with tree addresses
  const updatedConfig = {
    ...config,
    participation: {
      ...config.participation,
      treeAddress: participationTree.address
    },
    builder: {
      ...config.builder,
      treeAddress: builderTree.address
    }
  };

  saveConfig(updatedConfig);

  return updatedConfig;
}

/**
 * Estimate the cost to create a Merkle tree
 * Based on account size = 1.5 * (32 * 2^maxDepth + 32 * maxBufferSize * maxDepth)
 * @param {number} maxDepth - Maximum tree depth
 * @param {number} maxBufferSize - Maximum buffer size
 * @returns {number} Estimated cost in SOL
 */
export function estimateTreeCost(maxDepth = DEFAULT_MAX_DEPTH, maxBufferSize = DEFAULT_MAX_BUFFER_SIZE) {
  // Rough estimate based on account rent exemption
  // This is approximate - actual cost depends on network conditions
  const treeSize = 32 * Math.pow(2, maxDepth) + 32 * maxBufferSize * maxDepth;
  const rentPerByte = 0.00000696; // Approximate rent per byte per epoch
  return Math.ceil(treeSize * rentPerByte * 100) / 100;
}

export { DEFAULT_MAX_DEPTH, DEFAULT_MAX_BUFFER_SIZE };
