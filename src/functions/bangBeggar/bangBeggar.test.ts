import { getBangBeggarNotification } from '.';
import { makeLot } from '../../lots/data';
import { TicketStatus } from '../../lots/models';
import { makeBtcPayServerInvoice } from '../../services/btcPayServer/data';
import { makeTicket } from '../../tickets/data';
import { getUuid } from '../../utils/getUuid';
import { changeTicketsStatus } from '../changeTicketsStatus';
import { setupBangBeggarTest } from './bangBeggar.testUtils';

describe('bangBeggar', () => {
  it('returns an error when there are no reserved tickets', async () => {
    const { response } = await setupBangBeggarTest({ tickets: [] });

    expect(response).toEqual({
      error: true,
      message: 'tickets missing fool.',
    });
  });

  it('expires tickets', async () => {
    const lot = makeLot({
      id: getUuid(),
      active: true,
      totalAvailableTickets: 100000,
    });
    const tickets = [
      makeTicket({
        status: TicketStatus.reserved,
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
    const { response, dependencies } = await setupBangBeggarTest({
      tickets,
      invoice,
    });

    const expectedExpiredTickets = changeTicketsStatus(
      tickets,
      TicketStatus.expired,
    );
    expect(dependencies.firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedExpiredTickets,
    );

    expect(dependencies.sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBangBeggarNotification({
        expiredTickets: expectedExpiredTickets,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });
});
