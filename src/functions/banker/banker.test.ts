import { getBankerNotification } from '.';
import { makeInvoice, makeLot, makeTicket } from '../../lots/data';
import { TicketStatus } from '../../lots/models';
import { getUuid } from '../../utils/getUuid';
import { markTicketsStatus } from '../markTicketsStatus';
import { setupBankerTest } from './banker.testUtils';

describe('banker', () => {
  it('returns an error when there are no payment received tickets', async () => {
    const { response } = await setupBankerTest({ tickets: [] });

    expect(response).toEqual({
      error: true,
      message: 'Tickets missing fool.',
    });
  });

  it('confirms tickets', async () => {
    const lot = makeLot({});
    const tickets = [
      makeTicket({
        price: lot.ticketPriceInBTC,
        status: TicketStatus.paymentReceived,
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
    const { response, saveTickets, sendNotification } = await setupBankerTest({
      tickets,
      invoice,
    });

    const expectedConfirmedTickets = markTicketsStatus(
      tickets,
      TicketStatus.confirmed,
    );
    expect(saveTickets).toHaveBeenCalledWith(lot.id, expectedConfirmedTickets);

    expect(sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBankerNotification({
        confirmedTickets: expectedConfirmedTickets,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'Great success!',
    });
  });
});
