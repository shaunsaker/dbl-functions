import { createBlockchainHDWalletAddress } from './createBlockchainHDWalletAddress';

require('dotenv').config();

const doAsync = async () => {
  const walletName = process.argv[2];
  const wallet = await createBlockchainHDWalletAddress(walletName, 0);

  console.log('OUTPUT', JSON.stringify({ wallet }, undefined, 2));
};

doAsync();
