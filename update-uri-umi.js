import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { updateV1 } from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { readFileSync } from 'fs';

const umi = createUmi('https://api.devnet.solana.com').use(mplTokenMetadata());

try {
  // Load the keypair
  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(JSON.parse(readFileSync('C:/Users/Travi/.config/solana/id.json', 'utf8')))
  );
  umi.use(keypairIdentity(keypair));

  console.log("Wallet Public Key:", keypair.publicKey.toString());

  // Define the mint address
  const mint = publicKey('59PQyCUhDfsyschntZo7XnBxFujC46jcEtHCR59aFpPw');

  // Update the metadata
  const tx = await updateV1(umi, {
    mint,
    authority: umi.identity,
    data: {
      name: 'IgniteToken',
      symbol: 'IGN',
      uri: 'https://HarmsWAY88.github.io/IgniteToken/fitcoin.json',
      sellerFeeBasisPoints: 500,
      creators: null,
      collection: null,
      uses: null,
    },
  }).sendAndConfirm(umi);

  console.log("Metadata URI updated successfully. Transaction:", tx);
} catch (err) {
  console.error("Failed to update metadata:", err);
}