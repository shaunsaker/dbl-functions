// FIXME: this eslint error below
// eslint-disable-next-line
import axios, { AxiosError } from 'axios';
import { BtcPayServerEndpoint } from './models';

const get = <R>(endpoint: BtcPayServerEndpoint): Promise<R> => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get(
        `${process.env.BTC_PAY_INSTANCE_URL}/${endpoint}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${process.env.BTC_PAY_SERVER_API_KEY}`,
          },
        },
      );

      resolve(data);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};

const post = <R>(endpoint: BtcPayServerEndpoint, payload: any): Promise<R> => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post(
        `${process.env.BTC_PAY_INSTANCE_URL}/${endpoint}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${process.env.BTC_PAY_SERVER_API_KEY}`,
          },
        },
      );

      resolve(data);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};

export const btcPayServerApi = {
  get: <R>(endpoint: BtcPayServerEndpoint) => get<R>(endpoint),
  post: <R>(endpoint: BtcPayServerEndpoint, data: any) =>
    post<R>(endpoint, data),
};
