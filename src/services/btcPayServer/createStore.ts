import { btcPayServerApi } from '.';
import { BtcPayServerEndpoint, BtcPayServerStore } from './models';

type Payload = Omit<BtcPayServerStore, 'id'>;
type Response = BtcPayServerStore;

export const createStore = async (payload: Payload): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await btcPayServerApi.post<Response>(
        BtcPayServerEndpoint.stores,
        payload,
      );

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
