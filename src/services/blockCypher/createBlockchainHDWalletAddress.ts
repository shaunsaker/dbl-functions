// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { HDWallet } from './models';

export const createBlockchainHDWalletAddress = async (
  walletName: string,
  chainIndex: number,
): Promise<HDWallet> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(
        `${process.env.BLOCK_CYPHER_API}/wallets/hd/${walletName}/addresses/derive`,
        {
          token: process.env.BLOCK_CYPHER_TOKEN,
          subchain_index: chainIndex,
        },
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
