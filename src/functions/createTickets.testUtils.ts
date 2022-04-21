import { makeLot } from '../lots/data';
import { Lot, Ticket } from '../lots/models';
import { UserId } from '../userProfile/models';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';
import { createTickets } from './createTickets';

export const setupCreateTicketsTests = async ({
  lot = makeLot({}),
  uid = getUuid(),
  existingTickets = [],
  ticketCount = 1,
  ticketPriceBTC = 0.00025,
  invoicePaymentAddress = getUuid(),
  invoicePaymentAmountBTC = 0.00025,
  invoicePaymentRate = 50000,
  invoicePaymentExpiry = getTimeAsISOString(),
}: {
  lot?: Lot;
  uid?: UserId;
  existingTickets?: Ticket[];
  ticketCount?: number;
  ticketPriceBTC?: number;
  invoicePaymentAddress?: string;
  invoicePaymentAmountBTC?: number;
  invoicePaymentRate?: number;
  invoicePaymentExpiry?: string;
}) => {
  const firebaseFetchTickets = jest.fn();
  const firebaseWriteBatch = jest.fn();

  if (existingTickets) {
    firebaseFetchTickets.mockReturnValue(existingTickets);
  }

  const dependencies = {
    firebaseFetchTickets,
    firebaseWriteBatch,
  };
  const response = await createTickets({
    lot,
    uid,
    ticketCount,
    ticketPriceBTC,
    invoicePaymentAddress,
    invoicePaymentAmountBTC,
    invoicePaymentRate,
    invoicePaymentExpiry,
    dependencies,
  });

  return { response, dependencies };
};
