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
import { makeTicket } from '../../tickets/data';
import { Ticket } from '../../tickets/models';
import { getUuid } from '../../utils/getUuid';
import { changeTicketsStatus } from '../changeTicketsStatus';

export const setupBangBeggarTest = async ({
  storeId = getUuid(),
  invoiceId = getUuid(),
  invoice = makeBtcPayServerInvoice({}),
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
  const eventData = makeBtcPayServerInvoiceExpiredEventData({
    storeId,
    invoiceId,
  });

  const dependencies = {
    validateWebookEventData,
    firebaseFetchTickets,
    changeTicketsStatus,
    firebaseSaveTickets,
    sendNotification,
  };
  const response = await runBangBeggar(eventData, dependencies);

  return { response, dependencies };
};
