import { btcPayServerApi } from '.';
import { BtcPayServerEndpoint, BtcPayServerStore } from './models';

export const getStoreByStoreName = async (
  storeName: string,
): Promise<BtcPayServerStore | undefined> => {
  return new Promise(async (resolve, reject) => {
    try {
      const stores = await btcPayServerApi.get<BtcPayServerStore[]>(
        BtcPayServerEndpoint.stores,
      );
      const store = stores.find((store) => store.name === storeName);

      resolve(store);
    } catch (error) {
      reject(error);
    }
  });
};
