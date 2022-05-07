import { makeLot } from '../../lots/data';
import { makeTicket } from '../../tickets/data';
import { TicketStatus } from '../../tickets/models';
import { getUuid } from '../../utils/getUuid';
import { setupBuskerTest } from './busker.testUtils';
import { getLotStats } from './getLotStats';

describe('busker', () => {
  it('returns an error if there is no lot', async () => {
    const { response, dependencies } = await setupBuskerTest({ lot: null });

    expect(dependencies.firebaseFetchLot).toHaveBeenCalled();
    expect(response).toEqual({
      error: true,
      message: 'lot missing fool.',
      data: undefined,
    });
  });

  it('updates the lot stats', async () => {
    const lotId = getUuid();
    const lot = makeLot({
      id: lotId,
      active: true,
      totalAvailableTickets: 100000,
    });
    const ticketBefore = makeTicket({ status: TicketStatus.reserved });
    const ticketAfter = makeTicket({ status: TicketStatus.confirmed }); // add a confirmed ticket
    const { response, dependencies } = await setupBuskerTest({
      lotId,
      lot,
      ticketBefore,
      ticketAfter,
    });

    expect(dependencies.firebaseFetchLot).toHaveBeenCalled();
    expect(dependencies.firebaseUpdateLot).toHaveBeenCalledWith(
      lotId,
      getLotStats({ lot, ticketBefore, ticketAfter }),
    );
    expect(response).toEqual({
      error: false,
      message: 'great success!',
      data: undefined,
    });
  });
});
