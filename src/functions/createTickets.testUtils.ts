import { InvoiceId } from '../invoices/models';
import { makeLot } from '../lots/data';
import { Lot } from '../lots/models';
import { Ticket } from '../tickets/models';
import { UserId } from '../userProfile/models';
import { getUuid } from '../utils/getUuid';
import { createTickets } from './createTickets';

export const setupCreateTicketsTests = async ({
  lot = makeLot({ id: getUuid(), active: true, totalAvailableTickets: 100000 }),
  uid = getUuid(),
  existingTickets = [],
  ticketCount = 1,
  ticketPriceBTC = 0.00025,
  invoiceId = getUuid(),
}: {
  lot?: Lot;
  uid?: UserId;
  existingTickets?: Ticket[];
  ticketCount?: number;
  ticketPriceBTC?: number;
  invoiceId?: InvoiceId;
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
    invoiceId,
    dependencies,
  });

  return { response, dependencies };
};
