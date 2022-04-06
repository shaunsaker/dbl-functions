import axios, { AxiosError } from 'axios';
import { BlockchainAddress } from '../../models';
import { Tx, TXSkeleton } from './models';
import { signBlockchainTransaction } from './signBlockchainTransaction';

export const createBlockchainTransaction = async ({
  inputAddress,
  inputAddressPrivateKey,
  outputAddress,
  value,
}: {
  inputAddress: BlockchainAddress;
  inputAddressPrivateKey: string;
  outputAddress: BlockchainAddress;
  value: number; // in satoshi
}): Promise<Tx> => {
  try {
    const txSkeleton: TXSkeleton = (
      await axios.post(`${process.env.BLOCK_CYPHER_API}/txs/new`, {
        token: process.env.BLOCK_CYPHER_TOKEN,
        inputs: [{ addresses: [inputAddress] }],
        outputs: [{ addresses: [outputAddress], value }],
        includeToSignTx: true,
      })
    ).data;

    // FIXME: FYI there is a validation step missing here, BlockCypher does not return the tosign_tx field needed for validation

    const signedTxSkeleton = await signBlockchainTransaction({
      txSkeleton,
      privateKey: inputAddressPrivateKey,
    });

    // send the signed transaction
    return (
      await axios.post(
        `${process.env.BLOCK_CYPHER_API}/txs/send`,
        signedTxSkeleton,
      )
    ).data.tx;
  } catch (error) {
    return (error as AxiosError).response?.data;
  }
};
