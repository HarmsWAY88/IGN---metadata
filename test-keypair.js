const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

try {
  const keypairPath = 'C:\\Users\\travi\\.config\\solana\\id.json';
  const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(keypairPath)));
  const wallet = Keypair.fromSecretKey(secretKey);
  console.log('Public Key:', wallet.publicKey.toString());
} catch (error) {
  console.error('Error loading keypair:', error);
}