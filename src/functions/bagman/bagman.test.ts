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
      message: 'Lot missing fool.',
    });
  });

  it('returns an error when there are no reserved tickets', async () => {
    const { response } = await setupBagmanTest({ tickets: [] });

    expect(response).toEqual({
      error: true,
      message: 'Tickets missing fool.',
    });
  });

  it('handles a single exact payment', async () => {
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
    const paymentAmountBTC = lot.ticketPriceInBTC;
    const { response, firebaseSaveTickets, sendNotification } =
      await setupBagmanTest({
        lot,
        tickets,
        invoice,
        paymentValueUSD: paymentAmountBTC * lot.BTCPriceInUSD,
      });

    const expectedPaidTickets = changeTicketsStatus(
      tickets,
      TicketStatus.paymentReceived,
    );
    expect(firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedPaidTickets,
    );

    expect(sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        paymentAmountBTC: paymentAmountBTC,
        paidTickets: expectedPaidTickets,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'Great success!',
    });
  });

  it('handles multiple exact payments', async () => {
    const lot = makeLot({});
    const tickets = [
      makeTicket({
        price: lot.ticketPriceInBTC,
        status: TicketStatus.reserved,
      }),
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
    const paymentAmountBTC = 2 * lot.ticketPriceInBTC;
    const { response, firebaseSaveTickets, sendNotification } =
      await setupBagmanTest({
        lot,
        tickets,
        invoice,
        paymentValueUSD: paymentAmountBTC * lot.BTCPriceInUSD,
      });

    const expectedPaidTickets = changeTicketsStatus(
      tickets,
      TicketStatus.paymentReceived,
    );
    expect(firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedPaidTickets,
    );

    expect(sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        paymentAmountBTC: paymentAmountBTC,
        paidTickets: expectedPaidTickets,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'Great success!',
    });
  });

  it('handles under payments when they can afford at least one ticket', async () => {
    const lot = makeLot({});
    const tickets = [
      makeTicket({
        price: lot.ticketPriceInBTC,
        status: TicketStatus.reserved,
      }),
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
    const paymentAmountBTC = lot.ticketPriceInBTC; // only 1 of the 2
    const { response, firebaseSaveTickets, sendNotification } =
      await setupBagmanTest({
        lot,
        tickets,
        invoice,
        paymentValueUSD: paymentAmountBTC * lot.BTCPriceInUSD,
      });

    const expectedPaidTickets = changeTicketsStatus(
      [tickets[0]], // only 1 of the 2
      TicketStatus.paymentReceived,
    );
    expect(firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedPaidTickets,
    );

    expect(sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        paymentAmountBTC: paymentAmountBTC,
        paidTickets: expectedPaidTickets,
      }),
    });
    expect(response).toEqual({
      error: false,
      message: 'Great success!',
    });
  });

  it('handles under payments when they cant afford any tickets', async () => {
    const lot = makeLot({});
    const tickets = [
      makeTicket({
        price: lot.ticketPriceInBTC,
        status: TicketStatus.reserved,
      }),
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
    const paymentAmountBTC = lot.ticketPriceInBTC / 2; // only 1/2 a ticket
    const { response, firebaseSaveTickets, sendNotification } =
      await setupBagmanTest({
        lot,
        tickets,
        invoice,
        paymentValueUSD: paymentAmountBTC * lot.BTCPriceInUSD,
      });

    const expectedPaidTickets = changeTicketsStatus(
      [], // only paid for half a ticket, we should not be saving anything
      TicketStatus.paymentReceived,
    );
    expect(firebaseSaveTickets).toHaveBeenCalledWith(
      lot.id,
      expectedPaidTickets,
    );

    expect(sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        paymentAmountBTC: paymentAmountBTC,
        paidTickets: expectedPaidTickets,
      }),
    });
    expect(response).toEqual({
      error: false,
      message: 'Great success!',
    });
  });
});
