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
    return {
      error: true,
      message: 'storeId missing fool.',
    };
  }

  if (!invoiceId) {
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
    return {
      error: true,
      message: 'Invoice missing fool.',
    };
  }

  const { lotId, uid, ticketIds } = invoice.metadata;

  if (!lotId) {
    return {
      error: true,
      message: 'lotId missing from invoice fool.',
    };
  }

  if (!uid) {
    return {
      error: true,
      message: 'uid missing from invoice fool.',
    };
  }

  if (!ticketIds) {
    return {
      error: true,
      message: 'ticketIds missing from invoice fool.',
    };
  }

  if (!ticketIds.length) {
    return {
      error: true,
      message: 'ticketIds in invoice are empty fool.',
    };
  }

  return {
    error: false,
    message: 'Great success!',
    data: invoice,
  };
};
