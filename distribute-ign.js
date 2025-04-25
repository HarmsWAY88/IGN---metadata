import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createTransferCheckedInstruction, getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { readFileSync } from 'fs';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function distributeTokens(recipientPubkey, amount) {
  try {
    // Load the admin keypair
    const adminKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(readFileSync('C:/Users/Travi/.config/solana/id.json', 'utf8')))
    );
    console.log("Admin Public Key:", adminKeypair.publicKey.toBase58());

    // Define the token mint address
    const mint = new PublicKey('59PQyCUhDfsyschntZo7XnBxFujC46jcEtHCR59aFpPw');

    // Get the admin's associated token account
    const adminTokenAccount = await getAssociatedTokenAddress(mint, adminKeypair.publicKey);

    // Get the recipient's associated token account
    const recipientTokenAccount = await getAssociatedTokenAddress(mint, new PublicKey(recipientPubkey));

    // Check if the recipient's token account exists
    let recipientAccount;
    try {
      recipientAccount = await getAccount(connection, recipientTokenAccount);
    } catch (error) {
      console.log("Recipient token account does not exist. It should be created by the recipient wallet.");
      return;
    }

    // Amount to transfer (in smallest units, considering 9 decimals)
    const amountInUnits = BigInt(Math.floor(amount * 10**9));

    // Create the transfer instruction
    const transferInstruction = createTransferCheckedInstruction(
      adminTokenAccount, // Source
      mint,             // Mint
      recipientTokenAccount, // Destination
      adminKeypair.publicKey, // Owner
      amountInUnits,    // Amount
      9                 // Decimals
    );

    // Create a transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = adminKeypair.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Sign and send the transaction
    const signature = await connection.sendTransaction(transaction, [adminKeypair]);
    await connection.confirmTransaction(signature, 'confirmed');

    console.log(`Successfully distributed ${amount} IGN to ${recipientPubkey}. Signature: ${signature}`);
  } catch (error) {
    console.error("Failed to distribute tokens:", error);
  }
}

// Example usage: Replace with the actual recipient public key
const recipient = "D3YoHyNJAhjLf6obsfCDEV6L5TW4wXB3WZ2gy53nJDuP"; // Temporary account for testing
const amountToDistribute = 10; // 10 IGN as a reward
distributeTokens(recipient, amountToDistribute);