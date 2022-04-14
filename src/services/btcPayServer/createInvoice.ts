import { btcPayServerApi } from '.';
import { Invoice, InvoicePayload } from '../../stores/models';
import { BtcPayServerEndpoint, BtcPayServerStoreId } from './models';

type Payload = InvoicePayload;
type Response = Invoice;

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
