import { BlockchainAddress } from '../models';
import { createBlockchainTransaction } from '../services/blockCypher/createBlockchainTransaction';
import { BLOCK_CYPHER_TEST_FEE_BYTES } from '../services/blockCypher/models';
import { btcToSatoshi } from '../utils/btcToSatoshi';

export const testSendBTCFromAddress = async ({
  inputAddress,
  inputAddressPrivateKey,
  outputAddress,
  BTCValue,
}: {
  inputAddress: BlockchainAddress;
  inputAddressPrivateKey: string;
  outputAddress: BlockchainAddress;
  BTCValue: number;
}) => {
  // convert the btc to satoshi
  const valueInSatoshi = btcToSatoshi(BTCValue);

  // create the transaction on the blockchain
  const feesInSatoshi = BLOCK_CYPHER_TEST_FEE_BYTES; // avg amount for a transaction with single input and output
  const tx = await createBlockchainTransaction({
    inputAddress,
    inputAddressPrivateKey,
    feesInSatoshi,
    outputAddress,
    valueInSatoshi,
  });

  console.log(`Tx: https://live.blockcypher.com/btc-testnet/tx/${tx.hash}`);
  console.log(
    `Address: https://live.blockcypher.com/btc-testnet/address/${outputAddress}`,
  );

  return tx;
};
