// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { AddressKeychain } from './models';

export const createBlockchainAddress = async (): Promise<AddressKeychain> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(
        `${process.env.BLOCK_CYPHER_API}/addrs`,
        {
          token: process.env.BLOCK_CYPHER_TOKEN,
        },
      );
      const addressKeychain = response.data;

      resolve(addressKeychain);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
