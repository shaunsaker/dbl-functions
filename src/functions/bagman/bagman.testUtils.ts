import { runBagman } from '.';
import { makeInvoice, makeLot, makeTicket } from '../../lots/data';
import { Lot, Ticket } from '../../lots/models';
import { makeBtcPayServerInvoiceReceivedPaymentEventData } from '../../services/btcPayServer/data';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from '../../services/btcPayServer/models';
import { getUuid } from '../../utils/getUuid';
import { changeTicketsStatus } from '../changeTicketsStatus';

export const setupBagmanTest = async ({
  storeId = getUuid(),
  invoiceId = getUuid(),
  invoice = makeInvoice({}),
  lot = makeLot({}),
  tickets = [makeTicket({})],
  paymentValueUSD = 10,
}: {
  storeId?: BtcPayServerStoreId;
  invoiceId?: BtcPayServerInvoiceId;
  invoice?: BtcPayServerInvoice | null;
  lot?: Lot | null;
  tickets?: Ticket[];
  paymentValueUSD?: number;
}) => {
  const validateWebookEventData = jest.fn();
  const firebaseFetchLot = jest.fn();
  const firebaseFetchTickets = jest.fn();
  const firebaseSaveTickets = jest.fn();
  const sendNotification = jest.fn();

  validateWebookEventData.mockReturnValue({
    error: false,
    data: invoice,
  });

  if (lot) {
    firebaseFetchLot.mockReturnValue(lot);
  }

  if (tickets) {
    firebaseFetchTickets.mockReturnValue(tickets);
  }

  sendNotification.mockReturnValue({
    error: false,
  });

  // create the webhook payment event
  const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
    storeId,
    invoiceId,
    value: paymentValueUSD,
  });

  const dependencies = {
    validateWebookEventData,
    firebaseFetchLot,
    firebaseFetchTickets,
    changeTicketsStatus,
    firebaseSaveTickets,
    sendNotification,
  };
  const response = await runBagman(eventData, dependencies);

  return { response, dependencies };
};