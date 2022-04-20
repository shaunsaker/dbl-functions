import { btcPayServerApi } from '.';
import {
  BtcPayServerEndpoint,
  BtcPayServerInvoiceId,
  BtcPayServerPaymentMethods,
  BtcPayServerStoreId,
} from './models';

type Response = BtcPayServerPaymentMethods;

export const getInvoicePaymentMethods = async ({
  storeId,
  invoiceId,
}: {
  storeId: BtcPayServerStoreId;
  invoiceId: BtcPayServerInvoiceId;
}): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    try {
      const endpoint = `${BtcPayServerEndpoint.stores}/${storeId}/invoices/${invoiceId}/payment-methods`;

      const data = await btcPayServerApi.get<Response>(endpoint);

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
