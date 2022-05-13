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
  const notifyUser = jest.fn();

  validateWebookEventData.mockReturnValue({
    error: false,
    data: invoice,
  });

  notifyUser.mockReturnValue({
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
    notifyUser,
  };
  const response = await runBangBeggar(eventData, dependencies);

  return { response, dependencies };
};
