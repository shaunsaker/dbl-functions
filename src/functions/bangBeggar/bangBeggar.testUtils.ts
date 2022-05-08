import { runBangBeggar } from '.';
import {
  makeBtcPayServerInvoice,
  makeBtcPayServerInvoiceExpiredEventData,
} from '../../services/btcPayServer/data';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from '../../services/btcPayServer/models';
import { getUuid } from '../../utils/getUuid';

export const setupBangBeggarTest = async ({
  storeId = getUuid(),
  invoiceId = getUuid(),
  invoice = makeBtcPayServerInvoice({}),
}: {
  storeId?: BtcPayServerStoreId;
  invoiceId?: BtcPayServerInvoiceId;
  invoice?: BtcPayServerInvoice | null;
}) => {
  const validateWebookEventData = jest.fn();
  const firebaseUpdateInvoice = jest.fn();
  const sendNotification = jest.fn();

  validateWebookEventData.mockReturnValue({
    error: false,
    data: invoice,
  });

  sendNotification.mockReturnValue({
    error: false,
  });

  // create the webhook expired event
  const eventData = makeBtcPayServerInvoiceExpiredEventData({
    storeId,
    invoiceId,
  });

  const dependencies = {
    validateWebookEventData,
    firebaseUpdateInvoice,
    sendNotification,
  };
  const response = await runBangBeggar(eventData, dependencies);

  return { response, dependencies };
};
