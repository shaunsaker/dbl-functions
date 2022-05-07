import { makeBtcPayServerInvoice } from '../services/btcPayServer/data';
import { makeBtcPayServerInvoiceReceivedPaymentEventData } from '../services/btcPayServer/data';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from '../services/btcPayServer/models';
import { getUuid } from '../utils/getUuid';
import { validateWebookEventData } from './validateWebhookEventData';

export const setupValidateWebhookEventDataTest = async ({
  storeId = getUuid(),
  invoiceId = getUuid(),
  invoice = makeBtcPayServerInvoice({}),
  paymentValueUSD = 10,
}: {
  storeId?: BtcPayServerStoreId;
  invoiceId?: BtcPayServerInvoiceId;
  invoice?: BtcPayServerInvoice | null;
  paymentValueUSD?: number;
}) => {
  const getInvoice = jest.fn();

  if (invoice) {
    getInvoice.mockReturnValue(invoice);
  }

  // create the webhook payment event
  const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
    storeId,
    invoiceId,
    value: paymentValueUSD,
  });

  const response = await validateWebookEventData(eventData, {
    getInvoice,
  });

  return { response };
};
