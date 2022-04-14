import { btcPayServerApi } from '.';
import { Invoice, InvoiceMetadata } from '../../stores/models';
import {
  BtcPayServerEndpoint,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from './models';

type Payload = { metadata: InvoiceMetadata };
type Response = Invoice;

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
