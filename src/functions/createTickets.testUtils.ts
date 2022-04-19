import { makeLot } from '../lots/data';
import { Lot, Ticket } from '../lots/models';
import { UserId } from '../userProfile/models';
import { getUuid } from '../utils/getUuid';
import { createTickets } from './createTickets';

export const setupCreateTicketsTests = async ({
  lot = makeLot({}),
  uid = getUuid(),
  existingTickets = [],
  ticketCount = 1,
}: {
  lot?: Lot;
  uid?: UserId;
  existingTickets?: Ticket[];
  ticketCount?: number;
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
  const response = await createTickets({ lot, uid, ticketCount, dependencies });

  return { response, dependencies };
};
