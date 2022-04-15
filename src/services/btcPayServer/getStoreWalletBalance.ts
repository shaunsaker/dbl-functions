import { btcPayServerApi } from '.';
import {
  BtcPayServerEndpoint,
  BtcPayServerStoreId,
  BtcPayServerStoreWalletBalance,
} from './models';

type Response = BtcPayServerStoreWalletBalance;

export const getStoreWalletBalance = async (
  storeId: BtcPayServerStoreId,
): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const endpoint = `${BtcPayServerEndpoint.stores}/${storeId}/payment-methods/OnChain/BTC/wallet`;

      const data = await btcPayServerApi.get<Response>(endpoint);

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
