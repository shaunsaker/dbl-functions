import { getBagmanNotification } from '.';
import { makeLot } from '../../lots/data';
import { makeBtcPayServerInvoice } from '../../services/btcPayServer/data';
import { makeTicket } from '../../tickets/data';
import { TicketStatus } from '../../tickets/models';
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
    const lot = makeLot({
      id: getUuid(),
      active: true,
      totalAvailableTickets: 100000,
    });
    const ticketPriceBTC = 0.00025;
    const tickets = [
      makeTicket({
        priceBTC: ticketPriceBTC,
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
    const paymentAmountBTC = ticketPriceBTC;
    const invoiceTotalBTC = paymentAmountBTC;
    const { response, dependencies } = await setupBagmanTest({
      lot,
      tickets,
      invoice,
      paymentAmountBTC,
      invoiceTotalBTC,
    });

    expect(dependencies.getInvoicePaymentMethods).toHaveBeenCalledWith({
      storeId: invoice.storeId,
      invoiceId: invoice.id,
    });

    expect(dependencies.firebaseCreatePayment).toHaveBeenCalledWith({
      lotId: lot.id,
      invoiceId: invoice.id,
      payment: {
        id: expect.any(String),
        uid: expect.any(String),
        txId: expect.any(String),
        lotId: expect.any(String),
        invoiceId: expect.any(String),
        amountBTC: paymentAmountBTC,
        receivedDate: expect.any(String),
        destination: expect.any(String),
      },
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
        hasPaidInFull: true,
        paymentAmountBTC,
        totalPaidBTC: paymentAmountBTC,
        invoiceTotalBTC: paymentAmountBTC,
        paidTicketCount: tickets.length,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });

  it('handles multiple exact payments', async () => {
    const lot = makeLot({
      id: getUuid(),
      active: true,
      totalAvailableTickets: 100000,
    });
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
    const invoice = makeBtcPayServerInvoice({
      metadata: {
        lotId: lot.id,
        uid,
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    });
    const paymentAmountBTC = 2 * ticketPriceBTC;
    const invoiceTotalBTC = paymentAmountBTC;
    const { response, dependencies } = await setupBagmanTest({
      lot,
      tickets,
      invoice,
      paymentAmountBTC,
      invoiceTotalBTC,
    });

    expect(dependencies.getInvoicePaymentMethods).toHaveBeenCalledWith({
      storeId: invoice.storeId,
      invoiceId: invoice.id,
    });

    expect(dependencies.firebaseCreatePayment).toHaveBeenCalledWith({
      lotId: lot.id,
      invoiceId: invoice.id,
      payment: {
        id: expect.any(String),
        uid: expect.any(String),
        txId: expect.any(String),
        lotId: expect.any(String),
        invoiceId: expect.any(String),
        amountBTC: paymentAmountBTC,
        receivedDate: expect.any(String),
        destination: expect.any(String),
      },
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
        hasPaidInFull: true,
        paymentAmountBTC,
        totalPaidBTC: paymentAmountBTC,
        invoiceTotalBTC: paymentAmountBTC,
        paidTicketCount: tickets.length,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });

  it('handles partial payments', async () => {
    const lot = makeLot({
      id: getUuid(),
      active: true,
      totalAvailableTickets: 100000,
    });
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
    const invoice = makeBtcPayServerInvoice({
      metadata: {
        lotId: lot.id,
        uid,
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    });
    const paymentAmountBTC = ticketPriceBTC; // only 1 of the 2
    const invoiceTotalBTC = ticketPriceBTC * 2;
    const { dependencies } = await setupBagmanTest({
      lot,
      tickets,
      invoice,
      paymentAmountBTC,
      invoiceTotalBTC,
    });

    expect(dependencies.getInvoicePaymentMethods).toHaveBeenCalledWith({
      storeId: invoice.storeId,
      invoiceId: invoice.id,
    });

    expect(dependencies.firebaseCreatePayment).toHaveBeenCalledWith({
      lotId: lot.id,
      invoiceId: invoice.id,
      payment: {
        id: expect.any(String),
        uid: expect.any(String),
        txId: expect.any(String),
        lotId: expect.any(String),
        invoiceId: expect.any(String),
        amountBTC: paymentAmountBTC,
        receivedDate: expect.any(String),
        destination: expect.any(String),
      },
    });

    expect(dependencies.firebaseSaveTickets).not.toHaveBeenCalled();

    expect(dependencies.sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        hasPaidInFull: false,
        paymentAmountBTC,
        totalPaidBTC: paymentAmountBTC,
        invoiceTotalBTC,
        paidTicketCount: tickets.length,
      }),
    });
  });
});
