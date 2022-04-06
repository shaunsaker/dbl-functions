import { createBlockchainAddress } from '../services/blockCypher/createBlockchainAddress';
import { createBlockchainAddressDepositWebhook } from '../services/blockCypher/createBlockchainAddressDepositWebhook';
import { createBlockchainTransaction } from '../services/blockCypher/createBlockchainTransaction';
import { fundTestBlockchainAddress } from '../services/blockCypher/fundTestBlockchainAddress';

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

  // create an output wallet
  const outputAddressKeychain = await createBlockchainAddress();
  console.log('OUTPUT', outputAddressKeychain);

  const outputAddress = outputAddressKeychain.address;

  // create a webhook at the output address
  await createBlockchainAddressDepositWebhook(outputAddress);

  // send btc from the input wallet to the output wallet
  const tx = await createBlockchainTransaction({
    inputAddress: inputAddressKeychain.address,
    inputAddressPrivateKey: inputAddressKeychain.private,
    outputAddress,
    value: satoshiInWallet / 2, // send half the funds
  });

  console.log('RESULT', `https://live.blockcypher.com/bcy/tx/${tx.hash}`);
};

doAsync();
