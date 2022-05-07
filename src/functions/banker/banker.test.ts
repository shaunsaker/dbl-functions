import { getBankerNotification } from '.';
import { makeLot } from '../../lots/data';
import { makeBtcPayServerInvoice } from '../../services/btcPayServer/data';
import { makeTicket } from '../../tickets/data';
import { TicketStatus } from '../../tickets/models';
import { getUuid } from '../../utils/getUuid';
import { changeTicketsStatus } from '../changeTicketsStatus';
import { setupBankerTest } from './banker.testUtils';

describe('banker', () => {
  it('returns an error when there are no payment received tickets', async () => {
    const { response } = await setupBankerTest({ tickets: [] });

    expect(response).toEqual({
      error: true,
      message: 'tickets missing fool.',
    });
  });

  it('confirms tickets', async () => {
    const lot = makeLot({
      id: getUuid(),
      active: true,
      totalAvailableTickets: 100000,
    });
    const tickets = [
      makeTicket({
        status: TicketStatus.paymentReceived,
      }),
    ];
    const uid = getUuid();
    const invoice = makeBtcPayServerInvoice({
      metadata: {
        lotId: lot.id,
        uid,
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    });
    const { response, dependencies } = await setupBankerTest({
      tickets,
      invoice,
    });

    const expectedConfirmedTickets = changeTicketsStatus(
      tickets,
      TicketStatus.confirmed,
    );
    expect(dependencies.firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedConfirmedTickets,
    );

    expect(dependencies.sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBankerNotification({
        confirmedTickets: expectedConfirmedTickets,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });
});
