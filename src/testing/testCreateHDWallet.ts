import { createBlockchainHDWallet } from '../services/blockCypher/createBlockchainHDWallet';
import { deleteBlockchainHDWallet } from '../services/blockCypher/deleteBlockchainHDWallet';
import { createMnemonic } from '../utils/createMnemonic';
import { createXPubFromMnemonic } from '../utils/createXPubFromMnemonic';

require('dotenv').config();

const doAsync = async () => {
  // create an output HD wallet
  const walletName = process.argv[2];

  if (!walletName) {
    console.log('No wallet name');
    return;
  }

  // delete the wallet if it exists
  try {
    await deleteBlockchainHDWallet(walletName);
  } catch (error) {
    // do nothing
  }

  const mnemonic = createMnemonic();
  const xPub = createXPubFromMnemonic(mnemonic);
  const outputWallet = await createBlockchainHDWallet(walletName, xPub);
  console.log('OUTPUT', { walletName, mnemonic, xPub, outputWallet });
};

doAsync();
