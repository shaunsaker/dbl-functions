// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { BlockCypherBlockchain } from './models';

export const blockCypherGetBlockchain =
  async (): Promise<BlockCypherBlockchain> => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(`${process.env.BLOCK_CYPHER_API}`);
        const blockchain = response.data;

        resolve(blockchain);
      } catch (error: Error | AxiosError | unknown) {
        if (axios.isAxiosError(error) && error.response) {
          reject(new Error(JSON.stringify(error.response.data)));
        }

        reject(error);
      }
    });
  };
