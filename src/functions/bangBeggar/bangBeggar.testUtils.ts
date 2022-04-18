import { runBangBeggar } from '.';
import { makeInvoice, makeTicket } from '../../lots/data';
import { Ticket } from '../../lots/models';
import { makeBtcPayServerInvoiceExpiredEventData } from '../../services/btcPayServer/data';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from '../../services/btcPayServer/models';
import { getUuid } from '../../utils/getUuid';
import { markTicketsStatus } from '../markTicketsStatus';

export const setupBangBeggarTest = async ({
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
  const getInvoice = jest.fn();
  const firebaseFetchTickets = jest.fn();
  const saveTickets = jest.fn();
  const sendNotification = jest.fn();

  validateWebookEventData.mockReturnValue({
    error: false,
    data: invoice,
  });

  if (invoice) {
    getInvoice.mockReturnValue(invoice);
  }

  if (tickets) {
    firebaseFetchTickets.mockReturnValue(tickets);
  }

  sendNotification.mockReturnValue({
    error: false,
  });

  // create the webhook expired event
  const eventData = makeBtcPayServerInvoiceExpiredEventData({
    storeId,
    invoiceId,
  });

  const response = await runBangBeggar(eventData, {
    validateWebookEventData,
    getInvoice,
    firebaseFetchTickets,
    markTicketsStatus,
    saveTickets,
    sendNotification,
  });

  return { response, saveTickets, sendNotification };
};
