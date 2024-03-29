import { btcPayServerApi } from '.';
import { BtcPayServerEndpoint, BtcPayServerStore } from './models';

type Response = BtcPayServerStore[];

export const getStores = async (): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await btcPayServerApi.get<Response>(
        BtcPayServerEndpoint.stores,
      );

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
