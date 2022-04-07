// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { BlockchainAddress } from '../../models';

export const fundTestBlockchainAddress = async (
  address: BlockchainAddress,
  amount: number,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${process.env.BLOCK_CYPHER_API}/faucet?token=${process.env.BLOCK_CYPHER_TOKEN}`,
        {
          address,
          amount,
        },
      );

      resolve();
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
