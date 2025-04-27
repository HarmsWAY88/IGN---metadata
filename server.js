import express from 'express';
import pkgWeb3 from '@solana/web3.js';
import pkgToken from '@solana/spl-token';


const { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = pkgWeb3;
const { TOKEN_PROGRAM_ID, Token } = pkgToken;

const app = express();
app.use(express.json());

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.ADMIN_KEYPAIR)));
const tokenMint = new PublicKey('59PQyCUhDfsyschntZo7XnBxFujC46jcEtHCR59aFpPw');
const TOKEN_DECIMALS = 9; // IgniteToken has 9 decimals

// Function to get or create a token account
async function getOrCreateTokenAccount(connection, payer, mint, owner) {
    const associatedToken = new PublicKey(
        (await pkgWeb3.PublicKey.findProgramAddress(
            [
                owner.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program
        ))[0]
    );

    let accountInfo;
    try {
        accountInfo = await connection.getAccountInfo(associatedToken);
        if (accountInfo) {
            console.log('Token account exists:', associatedToken.toBase58());
            return associatedToken;
        }
    } catch (error) {
        console.error('Error checking token account:', error);
    }

    console.log('Token account does not exist, creating...');
    const newAccount = Keypair.generate();
    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: newAccount.publicKey,
            space: 165, // Token account size
            lamports: await connection.getMinimumBalanceForRentExemption(165),
            programId: TOKEN_PROGRAM_ID,
        }),
        pkgToken.Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            mint,
            newAccount.publicKey,
            owner
        )
    );

    transaction.feePayer = payer.publicKey;
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, newAccount]
    );
    console.log('Token account created, signature:', signature);
    return newAccount.publicKey;
}

app.post('/distribute', async (req, res) => {
    try {
        const { recipient, amount } = req.body;
        console.log('Received /distribute request:', { recipient, amount });

        const recipientPubkey = new PublicKey(recipient);
        console.log('Loading admin keypair...');
        console.log('Defining token mint...');

        console.log('Getting admin token account...');
        const adminTokenAccount = await getOrCreateTokenAccount(
            connection,
            adminKeypair,
            tokenMint,
            adminKeypair.publicKey
        );

        console.log('Getting recipient token account...');
        const recipientTokenAccount = await getOrCreateTokenAccount(
            connection,
            adminKeypair,
            tokenMint,
            recipientPubkey
        );

        console.log('Calculating amount in units...');
        const amountInUnits = BigInt(amount * 10 ** TOKEN_DECIMALS); // Adjust for decimals

        console.log('Transferring tokens...');
        const token = new Token(
            connection,
            tokenMint,
            TOKEN_PROGRAM_ID,
            adminKeypair
        );

        const transferInstruction = Token.createTransferCheckedInstruction(
            TOKEN_PROGRAM_ID,
            adminTokenAccount,
            tokenMint,
            recipientTokenAccount,
            adminKeypair.publicKey,
            [],
            Number(amountInUnits),
            TOKEN_DECIMALS
        );

        const transaction = new Transaction().add(transferInstruction);
        transaction.feePayer = adminKeypair.publicKey;
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [adminKeypair]
        );

        console.log('Transaction successful, signature:', signature);
        res.json({ success: true, signature });
    } catch (error) {
        console.error('Error in /distribute:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});