const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { createUpdateFieldInstruction } = require('@solana/spl-token-metadata');
const fs = require('fs');

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function updateMetadataUri() {
  try {
    const keypairPath = 'C:\\Users\\Travi\\.config\\solana\\id.json';
    const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(keypairPath)));
    const wallet = Keypair.fromSecretKey(secretKey);
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

    console.log('Mint:', mint.toString());
    console.log('Metadata PDA:', metadataPDA.toString());

    const updateInstruction = createUpdateFieldInstruction({
      programId: TOKEN_METADATA_PROGRAM_ID,
      metadata: metadataPDA,
      updateAuthority: wallet.publicKey,
      field: 'uri',
      value: 'http://localhost:8000/fitcoin.json',
    });

    const transaction = new Transaction().add(updateInstruction);
    const signature = await connection.sendTransaction(transaction, [wallet], { commitment: 'confirmed' });

    console.log('Metadata URI updated successfully. Transaction:', signature);
  } catch (error) {
    console.error('Error updating metadata URI:', error);
  }
}

updateMetadataUri();