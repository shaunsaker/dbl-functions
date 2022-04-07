import { AVERAGE_TX_SIZE_BYTES, BlockchainAddress } from '../../models';
import { createBlockchainAddress } from '../../services/blockCypher/createBlockchainAddress';
import { createBlockchainTransaction } from '../../services/blockCypher/createBlockchainTransaction';
import { fundTestBlockchainAddress } from '../../services/blockCypher/fundTestBlockchainAddress';
import { getBTCTxFeePerByte } from '../../services/earn/getBTCTxFeePerByte';
import { btcToSatoshi } from '../../utils/btcToSatoshi';

export const testSendBTCFromTemporaryAddress = async ({
  outputAddress,
  BTCValue,
}: {
  outputAddress: BlockchainAddress;
  BTCValue: number;
}) => {
  const inputAddressKeychain = await createBlockchainAddress();

  const satoshi = btcToSatoshi(BTCValue * 10); // * make sure we have enough fees
  await fundTestBlockchainAddress(inputAddressKeychain.address, satoshi);

  const fees = await getBTCTxFeePerByte();
  const feeEstimate = fees.fastestFee * AVERAGE_TX_SIZE_BYTES;

  const tx = await createBlockchainTransaction({
    inputAddress: inputAddressKeychain.address,
    inputAddressPrivateKey: inputAddressKeychain.private,
    outputAddress,
    value: btcToSatoshi(BTCValue) + feeEstimate,
  });

  console.log(`https://live.blockcypher.com/bcy/tx/${tx.hash}`);

  return tx;
};
