import { btcPayServerApi } from '.';
import {
  BtcPayServerEndpoint,
  BtcPayServerInvoice,
  BtcPayServerInvoicePayload,
  BtcPayServerStoreId,
} from './models';

type Payload = BtcPayServerInvoicePayload;
type Response = BtcPayServerInvoice;

export const createInvoice = async (
  storeId: BtcPayServerStoreId,
  payload: Payload,
): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const endpoint = `${BtcPayServerEndpoint.stores}/${storeId}/invoices`;

      const data = await btcPayServerApi.post<Response>(endpoint, payload);

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
