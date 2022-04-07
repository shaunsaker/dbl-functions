// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { Fees } from './models';

export const getBTCTxFeePerByte = async (): Promise<Fees> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        'https://bitcoinfees.earn.com/api/v1/fees/recommended',
      );
      const fees = response.data;

      resolve(fees);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
