import { getInvoice } from '../services/btcPayServer/getInvoice';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceExpiredEventData,
  BtcPayServerInvoiceReceivedPaymentEventData,
  BtcPayServerInvoiceSettledEventData,
} from '../services/btcPayServer/models';
import { FirebaseFunctionResponse } from '../services/firebase/models';

export const validateWebookEventData = async (
  data:
    | BtcPayServerInvoiceReceivedPaymentEventData
    | BtcPayServerInvoiceExpiredEventData
    | BtcPayServerInvoiceSettledEventData,
  dependencies: {
    getInvoice: typeof getInvoice;
  } = {
    getInvoice,
  },
): Promise<FirebaseFunctionResponse<BtcPayServerInvoice>> => {
  // we need to get the lotId and uid from the invoice
  // so we need to fetch the invoice
  const { storeId, invoiceId } = data;

  if (!storeId) {
    const message = 'storeId missing fool.';

    console.log(`validateWebhookEventData: ${message}`);

    return {
      error: true,
      message,
    };
  }

  if (!invoiceId) {
    const message = 'invoiceId missing fool.';

    console.log(`validateWebhookEventData: ${message}`);

    return {
      error: true,
      message: 'invoiceId missing fool.',
    };
  }

  const invoice = await dependencies.getInvoice({
    storeId,
    invoiceId,
  });

  if (!invoice) {
    const message = 'invoice missing fool.';

    console.log(`validateWebhookEventData: ${message}`);

    return {
      error: true,
      message,
    };
  }

  const { lotId, uid, ticketIds } = invoice.metadata;

  if (!lotId) {
    const message = 'lotId missing from invoice fool.';

    console.log(`validateWebhookEventData: ${message}`);

    return {
      error: true,
      message,
    };
  }

  if (!uid) {
    const message = 'uid missing from invoice fool.';

    console.log(`validateWebhookEventData: ${message}`);

    return {
      error: true,
      message,
    };
  }

  if (!ticketIds) {
    const message = 'ticketIds missing from invoice fool.';

    console.log(`validateWebhookEventData: ${message}`);

    return {
      error: true,
      message: 'ticketIds missing from invoice fool.',
    };
  }

  if (!ticketIds.length) {
    const message = 'ticketIds in invoice are empty fool.';

    console.log(`validateWebhookEventData: ${message}`);

    return {
      error: true,
      message,
    };
  }

  return {
    error: false,
    message: 'great success!',
    data: invoice,
  };
};
