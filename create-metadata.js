const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createMetadataAccountV3, mplTokenMetadata } = require('@metaplex-foundation/mpl-token-metadata');
const { keypairIdentity, publicKey } = require('@metaplex-foundation/umi');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function createMetadataForToken() {
  try {
    const keypairPath = 'C:\\Users\\Travi\\.config\\solana\\id.json';
    const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(keypairPath)));
    const wallet = Keypair.fromSecretKey(secretKey);
    if (!wallet.publicKey) {
      throw new Error('Failed to load public key from keypair');
    }
    console.log('Wallet Public Key:', wallet.publicKey.toString());

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const mint = new PublicKey('59PQyCUhDfsyschntZo7XnBxFujC46jcEtHCR59aFpPw');

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const metadata = {
      name: 'FitCoin',
      symbol: 'FIT',
      uri: 'https://example.com/fitcoin.json',
      sellerFeeBasisPoints: 0,
      creators: null,
    };

    console.log('Mint:', mint.toString());
    console.log('Metadata PDA:', metadataPDA.toString());

    // Set up Umi with string endpoint
    const umi = createUmi('https://api.devnet.solana.com', 'confirmed').use(mplTokenMetadata());

    // Create Umi keypair
    const umiKeypair = {
      publicKey: publicKey(wallet.publicKey.toString()),
      secretKey: secretKey,
    };
    umi.use(keypairIdentity(umiKeypair));

    // Convert keys to Umi format
    const umiMetadataPDA = publicKey(metadataPDA.toString());
    const umiMint = publicKey(mint.toString());
    const umiAuthority = publicKey(wallet.publicKey.toString());

    // Build and sign transaction with Umi
    const transaction = await createMetadataAccountV3(
      umi,
      {
        metadata: umiMetadataPDA,
        mint: umiMint,
        mintAuthority: umiAuthority,
        payer: umiAuthority,
        updateAuthority: umiAuthority,
        data: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
          creators: metadata.creators,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      }
    ).buildAndSign(umi);

    // Send transaction using Umi
    const signature = await umi.rpc.sendTransaction(transaction);

    console.log('Metadata created successfully for FitCoin. Transaction:', signature);
  } catch (error) {
    console.error('Error creating metadata:', error);
  }
}

createMetadataForToken();