// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { HDWallet } from './models';

export const getBlockchainHDWallet = async (
  name: string,
): Promise<HDWallet> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `${process.env.BLOCK_CYPHER_API}/wallets/hd/${name}?token=${process.env.BLOCK_CYPHER_TOKEN}`,
      );
      const HDWallet = response.data;

      resolve(HDWallet);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
