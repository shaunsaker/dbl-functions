import { runBagman } from '.';
import { makeLot } from '../../store/lots/data';
import { Lot } from '../../store/lots/models';
import {
  makeBtcPayServerInvoice,
  makeBtcPayServerInvoiceReceivedPaymentEventData,
} from '../../services/btcPayServer/data';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from '../../services/btcPayServer/models';
import { makeTicket } from '../../store/tickets/data';
import { Ticket } from '../../store/tickets/models';
import { getUuid } from '../../utils/getUuid';
import { changeTicketsStatus } from '../changeTicketsStatus';

export const setupBagmanTest = async ({
  storeId = getUuid(),
  invoiceId = getUuid(),
  invoice = makeBtcPayServerInvoice({}),
  lot = makeLot({ id: getUuid(), active: true, totalAvailableTickets: 100000 }),
  tickets = [makeTicket({})],
  paymentAmountBTC = 0.00025,
  invoiceTotalBTC = 0.00025,
}: {
  storeId?: BtcPayServerStoreId;
  invoiceId?: BtcPayServerInvoiceId;
  invoice?: BtcPayServerInvoice | null;
  lot?: Lot | null;
  tickets?: Ticket[];
  paymentAmountBTC?: number;
  invoiceTotalBTC?: number;
}) => {
  const validateWebookEventData = jest.fn();
  const firebaseFetchLot = jest.fn();
  const getInvoicePaymentMethods = jest.fn();
  const firebaseCreatePayment = jest.fn();
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

  if (paymentAmountBTC) {
    getInvoicePaymentMethods.mockReturnValue([
      {
        totalPaid: paymentAmountBTC.toString(),
        amount: invoiceTotalBTC.toString(),
        due: (invoiceTotalBTC - paymentAmountBTC).toString(),
        payments: [
          {
            id: getUuid(),
            uid: getUuid(),
            txId: getUuid(),
            lotId: getUuid(),
            invoiceId: getUuid(),
            amountBTC: paymentAmountBTC,
            receivedDate: 1650898417,
            destination: getUuid(),
          },
        ],
      },
    ]);
  }

  sendNotification.mockReturnValue({
    error: false,
  });

  // create the webhook payment event
  const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
    storeId,
    invoiceId,
    value: paymentAmountBTC,
  });

  const dependencies = {
    validateWebookEventData,
    firebaseFetchLot,
    getInvoicePaymentMethods,
    firebaseCreatePayment,
    firebaseFetchTickets,
    changeTicketsStatus,
    firebaseSaveTickets,
    sendNotification,
  };
  const response = await runBagman(eventData, dependencies);

  return { response, dependencies };
};
