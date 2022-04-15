import { btcPayServerApi } from '.';
import {
  BtcPayServerEndpoint,
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerInvoiceMetadata,
  BtcPayServerStoreId,
} from './models';

type Payload = { metadata: BtcPayServerInvoiceMetadata };
type Response = BtcPayServerInvoice;

export const updateInvoice = async (
  storeId: BtcPayServerStoreId,
  invoiceId: BtcPayServerInvoiceId,
  payload: Payload,
): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const endpoint = `${BtcPayServerEndpoint.stores}/${storeId}/invoices/${invoiceId}`;

      const data = await btcPayServerApi.put<Response>(endpoint, payload);

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
