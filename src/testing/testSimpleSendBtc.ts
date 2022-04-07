import { createBlockchainAddress } from '../services/blockCypher/createBlockchainAddress';
import { createBlockchainTransaction } from '../services/blockCypher/createBlockchainTransaction';
import { fundTestBlockchainAddress } from '../services/blockCypher/fundTestBlockchainAddress';
import { btcToSatoshi } from '../utils/btcToSatoshi';

require('dotenv').config();

const doAsync = async () => {
  const BTCValueToSend = 0.00029 * 5; // 5 tickets ~ 0.00145 BTC

  // create an input wallet
  const inputAddressKeychain = await createBlockchainAddress();
  console.log('INPUT', inputAddressKeychain);

  // fund the input wallet
  const satoshiInWallet = btcToSatoshi(1);
  await fundTestBlockchainAddress(
    inputAddressKeychain.address,
    satoshiInWallet,
  );

  // create an output wallet
  const outputAddressKeychain = await createBlockchainAddress();
  console.log('OUTPUT', outputAddressKeychain);

  const outputAddress = outputAddressKeychain.address;

  const satoshiToSend = btcToSatoshi(BTCValueToSend);

  // send btc from the input wallet to the output wallet
  const tx = await createBlockchainTransaction({
    inputAddress: inputAddressKeychain.address,
    inputAddressPrivateKey: inputAddressKeychain.private,
    outputAddress,
    valueInSatoshi: satoshiToSend,
  });

  console.log('RESULT TX:', `https://live.blockcypher.com/bcy/tx/${tx.hash}`);

  // we should have exactly BTCValueToSend at this address
  console.log(
    'RESULT ADDRESS:',
    `https://live.blockcypher.com/bcy/address/${outputAddress}`,
  );
};

doAsync();
