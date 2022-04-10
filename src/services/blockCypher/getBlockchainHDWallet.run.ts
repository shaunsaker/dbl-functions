import { getBlockchainHDWallet } from './getBlockchainHDWallet';

require('dotenv').config();

const doAsync = async () => {
  const walletName = process.argv[2];
  const wallet = await getBlockchainHDWallet(walletName);

  console.log('OUTPUT', JSON.stringify({ wallet }, undefined, 2));
};

doAsync();
