import { btcPayServerApi } from '.';
import {
  BtcPayServerEndpoint,
  BtcPayServerStoreId,
  BtcPayServerWebhook,
} from './models';

type Payload = BtcPayServerWebhook;
type Response = void;

export const createWebhook = async (
  storeId: BtcPayServerStoreId,
  payload: Payload,
): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const endpoint = `${BtcPayServerEndpoint.stores}/${storeId}/webhooks`;

      await btcPayServerApi.post<Response>(endpoint, payload);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
