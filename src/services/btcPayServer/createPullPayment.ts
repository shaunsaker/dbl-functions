import { btcPayServerApi } from '.';
import {
  BtcPayServerEndpoint,
  BtcPayServerStoreId,
  BtcPayServerPullPayment,
  BtcPayServerPullPaymentPayload,
} from './models';

type Payload = BtcPayServerPullPaymentPayload;
type Response = BtcPayServerPullPayment;

export const createPullPayment = async (
  storeId: BtcPayServerStoreId,
  payload: Payload,
): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const endpoint = `${BtcPayServerEndpoint.stores}/${storeId}/payment-methods/OnChain/BTC/wallet/transactions`;

      const data = await btcPayServerApi.post<Response>(endpoint, payload);

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
