import { runBanker } from '.';
import { makeInvoice, makeTicket } from '../../lots/data';
import { Ticket } from '../../lots/models';
import { makeBtcPayServerInvoiceSettledEventData } from '../../services/btcPayServer/data';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from '../../services/btcPayServer/models';
import { getUuid } from '../../utils/getUuid';
import { changeTicketsStatus } from '../changeTicketsStatus';

export const setupBankerTest = async ({
  storeId = getUuid(),
  invoiceId = getUuid(),
  invoice = makeInvoice({}),
  tickets = [makeTicket({})],
}: {
  storeId?: BtcPayServerStoreId;
  invoiceId?: BtcPayServerInvoiceId;
  invoice?: BtcPayServerInvoice | null;
  tickets?: Ticket[];
}) => {
  const validateWebookEventData = jest.fn();
  const firebaseFetchTickets = jest.fn();
  const firebaseSaveTickets = jest.fn();
  const sendNotification = jest.fn();

  validateWebookEventData.mockReturnValue({
    error: false,
    data: invoice,
  });

  if (tickets) {
    firebaseFetchTickets.mockReturnValue(tickets);
  }

  sendNotification.mockReturnValue({
    error: false,
  });

  // create the webhook expired event
  const eventData = makeBtcPayServerInvoiceSettledEventData({
    storeId,
    invoiceId,
    value: 0, // TODO: SS
  });

  const response = await runBanker(eventData, {
    validateWebookEventData,
    firebaseFetchTickets,
    changeTicketsStatus,
    firebaseSaveTickets,
    sendNotification,
  });

  return { response, firebaseSaveTickets, sendNotification };
};
