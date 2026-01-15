import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity } from '@metaplex-foundation/umi';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import bs58 from 'bs58';
import { getConfig } from './config.js';

/**
 * Create and configure Umi client
 * @returns {import('@metaplex-foundation/umi').Umi} Configured Umi instance
 */
export function createUmiClient() {
  const config = getConfig();

  // Create Umi instance with RPC endpoint
  const umi = createUmi(config.rpcUrl);

  // Decode private key from base58
  const secretKey = bs58.decode(config.privateKey);

  // Create keypair from secret key
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);

  // Create signer from keypair
  const signer = createSignerFromKeypair(umi, keypair);

  // Configure Umi with signer and plugins
  umi
    .use(signerIdentity(signer))
    .use(irysUploader({
      address: config.irysUrl,
    }))
    .use(mplBubblegum());

  return umi;
}

/**
 * Get the public key of the configured wallet
 * @param {import('@metaplex-foundation/umi').Umi} umi
 * @returns {string} Base58 encoded public key
 */
export function getWalletAddress(umi) {
  return umi.identity.publicKey.toString();
}

/**
 * Get wallet balance in SOL
 * @param {import('@metaplex-foundation/umi').Umi} umi
 * @returns {Promise<number>} Balance in SOL
 */
export async function getWalletBalance(umi) {
  const balance = await umi.rpc.getBalance(umi.identity.publicKey);
  return Number(balance.basisPoints) / 1e9;
}

export default createUmiClient;
