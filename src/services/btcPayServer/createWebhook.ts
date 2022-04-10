import { btcPayServerApi } from '.';
import { StoreId } from '../../models';
import { BtcPayServerEndpoint, BtcPayServerWebhook } from './models';

type Payload = BtcPayServerWebhook;
type Response = void;

export const createWebhook = async (
  storeId: StoreId,
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
