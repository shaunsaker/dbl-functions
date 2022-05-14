import { InvoiceId } from '../store/invoices/models';
import { makeLot } from '../store/lots/data';
import { Lot } from '../store/lots/models';
import { Ticket } from '../store/tickets/models';
import { UserId } from '../store/userProfile/models';
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
  const blockCypherGetBlockByHeight = jest.fn();
  const firebaseUpdateLot = jest.fn();
  const firebaseWriteBatch = jest.fn();

  if (existingTickets) {
    firebaseFetchTickets.mockReturnValue(existingTickets);
  }

  blockCypherGetBlockByHeight.mockReturnValue({ hash: getUuid() });

  const dependencies = {
    firebaseFetchTickets,
    blockCypherGetBlockByHeight,
    firebaseUpdateLot,
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
