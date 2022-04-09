import { createBlockchainAddress } from '../services/blockCypher/createBlockchainAddress';
import { createBlockchainTransaction } from '../services/blockCypher/createBlockchainTransaction';
import { fundTestBlockchainAddress } from '../services/blockCypher/fundTestBlockchainAddress';
import { btcToSatoshi } from '../utils/btcToSatoshi';

require('dotenv').config();

const doAsync = async () => {
  const outputAddress = process.argv[2];

  if (!outputAddress) {
    console.log('Please supply an output address');
  }

  const BTCValueToSend = process.argv[3];

  if (!BTCValueToSend) {
    console.log('Please supply a BTC value to send');
  }

  // create an input wallet
  const inputAddressKeychain = await createBlockchainAddress();
  console.log('INPUT', inputAddressKeychain);

  // fund the input wallet
  const satoshiInWallet = btcToSatoshi(1);
  await fundTestBlockchainAddress(
    inputAddressKeychain.address,
    satoshiInWallet,
  );

  const satoshiToSend = btcToSatoshi(parseFloat(BTCValueToSend));

  // send btc from the input wallet to the output wallet
  const tx = await createBlockchainTransaction({
    inputAddress: inputAddressKeychain.address,
    inputAddressPrivateKey: inputAddressKeychain.private,
    outputAddress,
    valueInSatoshi: satoshiToSend,
  });
  console.log({ outputAddress, BTCValueToSend, tx });

  console.log('RESULT TX:', `https://live.blockcypher.com/bcy/tx/${tx.hash}`);

  // we should have exactly BTCValueToSend at this address
  console.log(
    'RESULT ADDRESS:',
    `https://live.blockcypher.com/bcy/address/${outputAddress}`,
  );
};

doAsync();
