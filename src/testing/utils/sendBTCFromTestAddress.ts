import { BlockchainAddress } from '../../models';
import { createBlockchainAddress } from '../../services/blockCypher/createBlockchainAddress';
import { createBlockchainTransaction } from '../../services/blockCypher/createBlockchainTransaction';
import { fundTestBlockchainAddress } from '../../services/blockCypher/fundTestBlockchainAddress';
import { BLOCK_CYPHER_TEST_FEE_BYTES } from '../../services/blockCypher/models';
import { btcToSatoshi } from '../../utils/btcToSatoshi';

export const testSendBTCFromTemporaryAddress = async ({
  outputAddress,
  BTCValue,
}: {
  outputAddress: BlockchainAddress;
  BTCValue: number;
}) => {
  // create an input address
  const inputAddressKeychain = await createBlockchainAddress();

  // fund the input address
  const fundedSatoshi = btcToSatoshi(BTCValue) + BLOCK_CYPHER_TEST_FEE_BYTES;
  await fundTestBlockchainAddress(inputAddressKeychain.address, fundedSatoshi);

  // convert the btc to satoshi
  const valueInSatoshi = btcToSatoshi(BTCValue);

  // create the transaction on the blockchain
  const tx = await createBlockchainTransaction({
    inputAddress: inputAddressKeychain.address,
    inputAddressPrivateKey: inputAddressKeychain.private,
    outputAddress,
    valueInSatoshi,
  });

  console.log(`Tx: https://live.blockcypher.com/bcy/tx/${tx.hash}`);
  console.log(
    `Address: https://live.blockcypher.com/bcy/address/${outputAddress}`,
  );

  return tx;
};
