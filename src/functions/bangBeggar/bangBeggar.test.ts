import { getBangBeggarNotification } from '.';
import { makeInvoice, makeLot, makeTicket } from '../../lots/data';
import { TicketStatus } from '../../lots/models';
import { getUuid } from '../../utils/getUuid';
import { markTicketsStatus } from '../markTicketsStatus';
import { setupBangBeggarTest } from './bangBeggar.testUtils';

describe('bangBeggar', () => {
  it('returns an error when there are no reserved tickets', async () => {
    const { response } = await setupBangBeggarTest({ tickets: [] });

    expect(response).toEqual({
      error: true,
      message: 'Tickets missing fool.',
    });
  });

  it('expires tickets', async () => {
    const lot = makeLot({});
    const tickets = [
      makeTicket({
        price: lot.ticketPriceInBTC,
        status: TicketStatus.reserved,
      }),
    ];
    const uid = getUuid();
    const invoice = makeInvoice({
      metadata: {
        lotId: lot.id,
        uid,
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    });
    const { response, saveTickets, sendNotification } =
      await setupBangBeggarTest({
        tickets,
        invoice,
      });

    const expectedExpiredTickets = markTicketsStatus(
      tickets,
      TicketStatus.expired,
    );
    expect(saveTickets).toHaveBeenCalledWith(lot.id, expectedExpiredTickets);

    expect(sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBangBeggarNotification({
        expiredTickets: expectedExpiredTickets,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'Great success!',
    });
  });
});
