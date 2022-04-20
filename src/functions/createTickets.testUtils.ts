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
  invoicePaymentAddress = getUuid(),
  invoicePaymentTotal = 0.00025,
  invoicePaymentExpiry = getTimeAsISOString(),
}: {
  lot?: Lot;
  uid?: UserId;
  existingTickets?: Ticket[];
  ticketCount?: number;
  invoicePaymentAddress?: string;
  invoicePaymentTotal?: number;
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
    dependencies,
    invoicePaymentAddress,
    invoicePaymentTotal,
    invoicePaymentExpiry,
  });

  return { response, dependencies };
};
