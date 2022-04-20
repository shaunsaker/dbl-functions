import { runBookie } from '.';
import { makeInvoice, makeLot, makeTicket } from '../../lots/data';
import { Lot, LotId, Ticket } from '../../lots/models';
import {
  BtcPayServerInvoice,
  BtcPayServerStore,
} from '../../services/btcPayServer/models';
import { makeBtcPayServerStore } from '../../services/btcPayServer/data';
import { UserId } from '../../userProfile/models';
import { getUuid } from '../../utils/getUuid';

export const setupBookieTest = async ({
  uid = getUuid(),
  lotId = getUuid(),
  ticketCount = 1,
  isAuthUser = true,
  lot = makeLot({}),
  store = { ...makeBtcPayServerStore({}), id: getUuid() },
  tickets = [makeTicket({})],
  invoice = makeInvoice({}),
  invoicePaymentAddress = getUuid(),
}: {
  uid?: UserId;
  lotId?: LotId;
  ticketCount?: number;
  isAuthUser?: boolean;
  lot?: Lot | null;
  store?: BtcPayServerStore | null;
  tickets?: Ticket[];
  invoice?: BtcPayServerInvoice;
  invoicePaymentAddress?: string;
}) => {
  const firebaseGetUser = jest.fn();
  const firebaseFetchLot = jest.fn();
  const getStoreByStoreName = jest.fn();
  const createTickets = jest.fn();
  const createInvoice = jest.fn();
  const getInvoicePaymentMethods = jest.fn();
  const updateInvoice = jest.fn();

  if (isAuthUser) {
    firebaseGetUser.mockReturnValue(true);
  } else {
    firebaseGetUser.mockRejectedValue(new Error('No one home'));
  }

  if (lot) {
    firebaseFetchLot.mockReturnValue(lot);
  }

  if (store) {
    getStoreByStoreName.mockReturnValue(store);
  }

  if (tickets) {
    createTickets.mockReturnValue({
      error: false,
      data: tickets.map((ticket) => ticket.id),
    });
  }

  if (invoice) {
    createInvoice.mockReturnValue(invoice);

    updateInvoice.mockReturnValue(invoice);
  }

  if (invoicePaymentAddress) {
    getInvoicePaymentMethods.mockReturnValue([
      { destination: invoicePaymentAddress },
    ]);
  }

  const dependencies = {
    firebaseGetUser,
    firebaseFetchLot,
    getStoreByStoreName,
    createTickets,
    createInvoice,
    getInvoicePaymentMethods,
    updateInvoice,
  };
  const response = await runBookie({
    uid,
    lotId,
    ticketCount,
    dependencies,
  });

  return { response, dependencies };
};
