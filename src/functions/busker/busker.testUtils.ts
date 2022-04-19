import { runBusker } from '.';
import { makeLot, makeTicket } from '../../lots/data';
import { Lot, Ticket } from '../../lots/models';
import { getUuid } from '../../utils/getUuid';

export const setupBuskerTest = async ({
  lotId = getUuid(),
  ticketBefore = makeTicket({}),
  ticketAfter = makeTicket({}),
  lot = makeLot({}),
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
