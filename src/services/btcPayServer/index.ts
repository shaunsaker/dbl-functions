// FIXME: this eslint error below
// eslint-disable-next-line
import axios, { AxiosError } from 'axios';

const get = <R>(endpoint: string): Promise<R> => {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `${process.env.BTC_PAY_INSTANCE_URL}/${endpoint}`;
      const { data } = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `token ${process.env.BTC_PAY_SERVER_API_KEY}`,
        },
      });

      resolve(data);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(
          new Error(
            JSON.stringify(error.response.data || error.response.statusText),
          ),
        );
      }

      reject(error);
    }
  });
};

const post = <R>(endpoint: string, payload: any): Promise<R> => {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `${process.env.BTC_PAY_INSTANCE_URL}/${endpoint}`;
      const { data } = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `token ${process.env.BTC_PAY_SERVER_API_KEY}`,
        },
      });

      resolve(data);
    } catch (error: Error | AxiosError | unknown) {
      if (axios.isAxiosError(error) && error.response) {
        reject(new Error(JSON.stringify(error.response.data)));
      }

      reject(error);
    }
  });
};

const put = <R>(endpoint: string, payload: any): Promise<R> => {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `${process.env.BTC_PAY_INSTANCE_URL}/${endpoint}`;
      const { data } = await axios.put(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `token ${process.env.BTC_PAY_SERVER_API_KEY}`,
        },
      });

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
  get: <R>(endpoint: string) => get<R>(endpoint),
  post: <R>(endpoint: string, data: any) => post<R>(endpoint, data),
  put: <R>(endpoint: string, data: any) => put<R>(endpoint, data),
};
