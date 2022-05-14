// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { Block } from './models';

export const blockCypherGetBlockByHeight = async (
  height: number,
): Promise<Block> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `${process.env.BLOCK_CYPHER_API}/blocks/${height}`,
      );
      const block = response.data;

      resolve(block);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
