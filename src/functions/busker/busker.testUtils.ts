import { runBusker } from '.';
import { makeLot } from '../../store/lots/data';
import { Lot } from '../../store/lots/models';
import { makeTicket } from '../../store/tickets/data';
import { Ticket } from '../../store/tickets/models';
import { getUuid } from '../../utils/getUuid';

export const setupBuskerTest = async ({
  lotId = getUuid(),
  ticketBefore = makeTicket({}),
  ticketAfter = makeTicket({}),
  lot = makeLot({ id: getUuid(), active: true, totalAvailableTickets: 100000 }),
}: {
  lotId?: string;
  ticketBefore?: Ticket | undefined;
  ticketAfter?: Ticket | undefined;
  lot?: Lot | null;
}) => {
  const firebaseFetchLot = jest.fn();
  const firebaseUpdateLot = jest.fn();

  if (lot) {
    firebaseFetchLot.mockReturnValue(lot);
  }

  const dependencies = {
    firebaseFetchLot,
    firebaseUpdateLot,
  };
  const response = await runBusker({
    lotId,
    ticketBefore,
    ticketAfter,
    dependencies,
  });

  return { response, dependencies };
};
