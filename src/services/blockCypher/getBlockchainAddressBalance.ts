// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { AddressData } from './models';

export const getBlockchainAddressBalance = async (
  address: string,
): Promise<AddressData> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `${process.env.BLOCK_CYPHER_API}/addrs/${address}/balance`,
      );
      const addressData = response.data;

      resolve(addressData);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
