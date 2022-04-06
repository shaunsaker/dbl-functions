// eslint-disable-next-line
import axios, { AxiosError } from 'axios';

export const getBTCUSDPrice = async (): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        'https://api.binance.com/api/v1/ticker/price?symbol=BTCUSDT',
      );
      const price = parseFloat(response.data['price']);

      resolve(price);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};
