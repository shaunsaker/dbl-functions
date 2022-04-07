import { createBlockchainAddress } from '../services/blockCypher/createBlockchainAddress';
import { createBlockchainAddressDepositWebhook } from '../services/blockCypher/createBlockchainAddressDepositWebhook';
import { createBlockchainHDWallet } from '../services/blockCypher/createBlockchainHDWallet';
import { createBlockchainHDWalletAddress } from '../services/blockCypher/createBlockchainHDWalletAddress';
import { createBlockchainTransaction } from '../services/blockCypher/createBlockchainTransaction';
import { deleteBlockchainHDWallet } from '../services/blockCypher/deleteBlockchainHDWallet';
import { fundTestBlockchainAddress } from '../services/blockCypher/fundTestBlockchainAddress';
import { createMnemonic } from '../utils/createMnemonic';
import { createXPubFromMnemonic } from '../utils/createXPubFromMnemonic';
import { getBlockchainHDWalletAddresses } from '../services/blockCypher/getBlockchainHDWalletAddresses';

require('dotenv').config();

const doAsync = async () => {
  // create an input wallet
  const inputAddressKeychain = await createBlockchainAddress();
  console.log('INPUT', inputAddressKeychain);

  // fund the input wallet
  const satoshiInWallet = 100000000; // one btc
  await fundTestBlockchainAddress(
    inputAddressKeychain.address,
    satoshiInWallet,
  );

  // create an output HD wallet
  const walletName = 'test';

  // delete the wallet if it exists
  try {
    await deleteBlockchainHDWallet(walletName);
  } catch (error) {
    // do nothing
  }

  const mnemonic = createMnemonic();
  const xPub = createXPubFromMnemonic(mnemonic);
  const outputWallet = await createBlockchainHDWallet(walletName, xPub, [0, 1]);
  console.log('OUTPUT', { mnemonic, xPub, outputWallet });

  // create 2 chaining addresses in the HD wallet on the same index and one on a separate index
  await createBlockchainHDWalletAddress(walletName, 0);

  await createBlockchainHDWalletAddress(walletName, 0);

  await createBlockchainHDWalletAddress(walletName, 1);

  const outputAddresses = await getBlockchainHDWalletAddresses(walletName);
  console.log('OUTPUT', JSON.stringify(outputAddresses));

  const outputAddressKeychain = outputAddresses.chains[0].chain_addresses[0];
  console.log('OUTPUT', { outputAddressKeychain });

  const outputAddress = outputAddressKeychain.address;

  // create a webhook at the output address (we only care about the final chain)
  await createBlockchainAddressDepositWebhook(outputAddress);

  // send btc from the input wallet to the output wallet
  const tx = await createBlockchainTransaction({
    inputAddress: inputAddressKeychain.address,
    inputAddressPrivateKey: inputAddressKeychain.private,
    outputAddress,
    valueInSatoshi: satoshiInWallet / 2, // send half the funds
  });

  console.log('RESULT', `https://live.blockcypher.com/bcy/tx/${tx.hash}`);
};

doAsync();
