import { createGenericFile } from '@metaplex-foundation/umi';
import { readAsset, assetExists, saveConfig, loadConfig } from './utils.js';

// POAP metadata templates
const PARTICIPATION_METADATA = {
  name: "SSA Campus Tour Participant 2025",
  symbol: "SSAP",
  description: "Awarded to attendees of the Solana Students Africa Campus Tour 2025. This POAP recognizes your presence, interest, and membership in the SSA community.",
  attributes: [
    { trait_type: "Tier", value: "Participant" },
    { trait_type: "Program", value: "Campus Tour" },
    { trait_type: "Year", value: "2025" },
    { trait_type: "Issuer", value: "Solana Students Africa" }
  ]
};

const BUILDER_METADATA = {
  name: "SSA Campus Tour Builder 2025",
  symbol: "SSAB",
  description: "Awarded to builders who shipped on-chain during the Solana Students Africa Campus Tour 2025. This POAP verifies real execution and unlocks access to SSA Builder Programs, including early application access and Builder Spotlight eligibility.",
  attributes: [
    { trait_type: "Tier", value: "Builder" },
    { trait_type: "Program", value: "Campus Tour" },
    { trait_type: "Year", value: "2025" },
    { trait_type: "Issuer", value: "Solana Students Africa" },
    { trait_type: "Privileges", value: "Builder Program Early Access, Spotlight Eligibility" }
  ]
};

/**
 * Upload an image to Arweave via Irys
 * @param {import('@metaplex-foundation/umi').Umi} umi - Umi instance
 * @param {string} imagePath - Path to image file (relative to assets/)
 * @returns {Promise<string>} Arweave URI
 */
export async function uploadImage(umi, imagePath) {
  if (!assetExists(imagePath)) {
    throw new Error(`Image not found: assets/${imagePath}`);
  }

  const imageBuffer = readAsset(imagePath);
  const file = createGenericFile(imageBuffer, imagePath, {
    contentType: 'image/png'
  });

  const [uri] = await umi.uploader.upload([file]);
  return uri;
}

/**
 * Upload metadata JSON to Arweave via Irys
 * @param {import('@metaplex-foundation/umi').Umi} umi - Umi instance
 * @param {object} metadata - Metadata object
 * @returns {Promise<string>} Arweave URI
 */
export async function uploadMetadata(umi, metadata) {
  const uri = await umi.uploader.uploadJson(metadata);
  return uri;
}

/**
 * Upload all assets for both POAP tiers
 * @param {import('@metaplex-foundation/umi').Umi} umi - Umi instance
 * @returns {Promise<object>} Config with all URIs
 */
export async function uploadAllAssets(umi) {
  const config = loadConfig() || {};

  // Check required images exist
  const participationImage = 'participation-poap.png';
  const builderImage = 'builder-poap.png';

  if (!assetExists(participationImage)) {
    throw new Error(`Missing participation image: assets/${participationImage}`);
  }
  if (!assetExists(builderImage)) {
    throw new Error(`Missing builder image: assets/${builderImage}`);
  }

  console.log('\n📤 Uploading Participation POAP...');

  // Upload participation image
  const participationImageUri = await uploadImage(umi, participationImage);
  console.log(`   Image: ✅ ${participationImageUri}`);

  // Create and upload participation metadata
  const participationMetadataObj = {
    ...PARTICIPATION_METADATA,
    image: participationImageUri,
    properties: {
      files: [{ uri: participationImageUri, type: "image/png" }],
      category: "image"
    }
  };
  const participationMetadataUri = await uploadMetadata(umi, participationMetadataObj);
  console.log(`   Metadata: ✅ ${participationMetadataUri}`);

  console.log('\n📤 Uploading Builder POAP...');

  // Upload builder image
  const builderImageUri = await uploadImage(umi, builderImage);
  console.log(`   Image: ✅ ${builderImageUri}`);

  // Create and upload builder metadata
  const builderMetadataObj = {
    ...BUILDER_METADATA,
    image: builderImageUri,
    properties: {
      files: [{ uri: builderImageUri, type: "image/png" }],
      category: "image"
    }
  };
  const builderMetadataUri = await uploadMetadata(umi, builderMetadataObj);
  console.log(`   Metadata: ✅ ${builderMetadataUri}`);

  // Update config
  const updatedConfig = {
    ...config,
    network: process.env.NETWORK || 'devnet',
    participation: {
      ...config.participation,
      imageUri: participationImageUri,
      metadataUri: participationMetadataUri
    },
    builder: {
      ...config.builder,
      imageUri: builderImageUri,
      metadataUri: builderMetadataUri
    },
    createdAt: config.createdAt || new Date().toISOString()
  };

  saveConfig(updatedConfig);

  return updatedConfig;
}

export { PARTICIPATION_METADATA, BUILDER_METADATA };
