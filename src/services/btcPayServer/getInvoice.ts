import { btcPayServerApi } from '.';
import {
  BtcPayServerEndpoint,
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from './models';

type Response = BtcPayServerInvoice;

export const getInvoice = async ({
  storeId,
  invoiceId,
}: {
  storeId: BtcPayServerStoreId;
  invoiceId: BtcPayServerInvoiceId;
}): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const endpoint = `${BtcPayServerEndpoint.stores}/${storeId}/invoice/${invoiceId}`;

      const data = await btcPayServerApi.get<Response>(endpoint);

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
