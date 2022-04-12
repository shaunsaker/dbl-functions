// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { BlockchainAddress } from '../../models';
import { Tx, TXSkeleton } from './models';
import { signBlockchainTransaction } from './signBlockchainTransaction';

export const createBlockchainTransaction = async ({
  inputAddress,
  inputAddressPrivateKey,
  feesInSatoshi,
  outputAddress,
  valueInSatoshi,
}: {
  inputAddress: BlockchainAddress;
  inputAddressPrivateKey: string;
  feesInSatoshi: number;
  outputAddress: BlockchainAddress;
  valueInSatoshi: number;
}): Promise<Tx> => {
  return new Promise(async (resolve, reject) => {
    try {
      const txSkeleton: TXSkeleton = (
        await axios.post(`${process.env.BLOCK_CYPHER_API}/txs/new`, {
          token: process.env.BLOCK_CYPHER_TOKEN,
          fees: feesInSatoshi,
          inputs: [{ addresses: [inputAddress] }],
          outputs: [{ addresses: [outputAddress], value: valueInSatoshi }],
          includeToSignTx: true,
        })
      ).data;

      // FIXME: FYI there is a validation step missing here, BlockCypher does not return the tosign_tx field needed for validation

      const signedTxSkeleton = await signBlockchainTransaction({
        txSkeleton,
        privateKey: inputAddressPrivateKey,
      });

      // send the signed transaction
      const response = await axios.post(
        `${process.env.BLOCK_CYPHER_API}/txs/send`,
        signedTxSkeleton,
      );
      const tx = response.data.tx;

      resolve(tx);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
