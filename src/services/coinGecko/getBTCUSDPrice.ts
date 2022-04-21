// eslint-disable-next-line
import axios, { AxiosError } from 'axios';

export const getBTCUSDPrice = async (): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/priceBTC?ids=bitcoin&vs_currencies=usd',
      );
      const priceBTC = parseInt(response.data['bitcoin']['usd']);

      resolve(priceBTC);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
