import { getBagmanNotification } from '.';
import { makeInvoice, makeLot, makeTicket } from '../../lots/data';
import { TicketStatus } from '../../lots/models';
import { getUuid } from '../../utils/getUuid';
import { changeTicketsStatus } from '../changeTicketsStatus';
import { setupBagmanTest } from './bagman.testUtils';

describe('bagman', () => {
  it('returns an error when there is no matching lot', async () => {
    const { response } = await setupBagmanTest({ lot: null });

    expect(response).toEqual({
      error: true,
      message: 'lot missing fool.',
    });
  });

  it('returns an error when there are no reserved tickets', async () => {
    const { response } = await setupBagmanTest({ tickets: [] });

    expect(response).toEqual({
      error: true,
      message: 'tickets missing fool.',
    });
  });

  it('handles a single exact payment', async () => {
    const lot = makeLot({});
    const ticketPriceBTC = 0.00025;
    const tickets = [
      makeTicket({
        priceBTC: ticketPriceBTC,
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
    const paymentAmountBTC = ticketPriceBTC;
    const { response, dependencies } = await setupBagmanTest({
      lot,
      tickets,
      invoice,
      paymentAmountBTC,
    });

    const expectedPaidTickets = changeTicketsStatus(
      tickets,
      TicketStatus.paymentReceived,
    );
    expect(dependencies.firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedPaidTickets,
    );

    expect(dependencies.sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        paymentAmountBTC,
        paidTickets: expectedPaidTickets,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });

  it('handles multiple exact payments', async () => {
    const lot = makeLot({});
    const ticketPriceBTC = 0.00025;
    const tickets = [
      makeTicket({
        priceBTC: ticketPriceBTC,
        status: TicketStatus.reserved,
      }),
      makeTicket({
        priceBTC: ticketPriceBTC,
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
    const paymentAmountBTC = 2 * ticketPriceBTC;
    const { response, dependencies } = await setupBagmanTest({
      lot,
      tickets,
      invoice,
      paymentAmountBTC,
    });

    const expectedPaidTickets = changeTicketsStatus(
      tickets,
      TicketStatus.paymentReceived,
    );
    expect(dependencies.firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedPaidTickets,
    );

    expect(dependencies.sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        paymentAmountBTC: paymentAmountBTC,
        paidTickets: expectedPaidTickets,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });

  it('handles under payments when they can afford at least one ticket', async () => {
    const lot = makeLot({});
    const ticketPriceBTC = 0.00025;
    const tickets = [
      makeTicket({
        priceBTC: ticketPriceBTC,
        status: TicketStatus.reserved,
      }),
      makeTicket({
        priceBTC: ticketPriceBTC,
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
    const paymentAmountBTC = ticketPriceBTC; // only 1 of the 2
    const { response, dependencies } = await setupBagmanTest({
      lot,
      tickets,
      invoice,
      paymentAmountBTC,
    });

    const expectedPaidTickets = changeTicketsStatus(
      [tickets[0]], // only 1 of the 2
      TicketStatus.paymentReceived,
    );
    expect(dependencies.firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedPaidTickets,
    );

    expect(dependencies.sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        paymentAmountBTC: paymentAmountBTC,
        paidTickets: expectedPaidTickets,
      }),
    });
    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });

  it('handles under payments when they cant afford any tickets', async () => {
    const lot = makeLot({});
    const ticketPriceBTC = 0.00025;
    const tickets = [
      makeTicket({
        priceBTC: ticketPriceBTC,
        status: TicketStatus.reserved,
      }),
      makeTicket({
        priceBTC: ticketPriceBTC,
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
    const paymentAmountBTC = ticketPriceBTC / 2; // only 1/2 a ticket
    const { response, dependencies } = await setupBagmanTest({
      lot,
      tickets,
      invoice,
      paymentAmountBTC,
    });

    const expectedPaidTickets = changeTicketsStatus(
      [], // only paid for half a ticket, we should not be saving anything
      TicketStatus.paymentReceived,
    );
    expect(dependencies.firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedPaidTickets,
    );

    expect(dependencies.sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        paymentAmountBTC: paymentAmountBTC,
        paidTickets: expectedPaidTickets,
      }),
    });
    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });
});
