// eslint-disable-next-line
import axios, { AxiosError } from 'axios';

export const deleteBlockchainHDWallet = async (name: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.delete(
        `${process.env.BLOCK_CYPHER_API}/wallets/hd/${name}?token=${process.env.BLOCK_CYPHER_TOKEN}`,
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
