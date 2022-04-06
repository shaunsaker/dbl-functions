// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { HDWallet } from './models';

export const createBlockchainHDWallet = async (
  name: string,
  xPub: string,
  chainIndexes?: number[],
): Promise<HDWallet> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(
        `${process.env.BLOCK_CYPHER_API}/wallets/hd`,
        {
          token: process.env.BLOCK_CYPHER_TOKEN,
          name,
          extended_public_key: xPub,
          subchain_indexes: chainIndexes,
        },
      );
      const wallet = response.data;

      resolve(wallet);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
