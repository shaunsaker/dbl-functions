import { runBanker } from '.';
import {
  makeBtcPayServerInvoice,
  makeBtcPayServerInvoiceSettledEventData,
} from '../../services/btcPayServer/data';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from '../../services/btcPayServer/models';
import { getUuid } from '../../utils/getUuid';

export const setupBankerTest = async ({
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
  const eventData = makeBtcPayServerInvoiceSettledEventData({
    storeId,
    invoiceId,
    value: 0, // doesn't matter
  });

  const dependencies = {
    validateWebookEventData,
    firebaseUpdateInvoice,
    notifyUser,
  };
  const response = await runBanker(eventData, dependencies);

  return { response, dependencies };
};
