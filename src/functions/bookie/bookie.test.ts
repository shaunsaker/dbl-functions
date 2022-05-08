import { makeLot } from '../../store/lots/data';
import {
  makeBtcPayServerInvoice,
  makeBtcPayServerInvoicePayload,
} from '../../services/btcPayServer/data';
import { makeBtcPayServerStore } from '../../services/btcPayServer/data';
import { makeTicket } from '../../store/tickets/data';
import { arrayFromNumber } from '../../utils/arrayFromNumber';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { getUuid } from '../../utils/getUuid';
import { numberToDigits } from '../../utils/numberToDigits';
import { setupBookieTest } from './bookie.testUtils';
import { InvoiceStatus } from '../../store/invoices/models';

describe('bookie', () => {
  it('returns an error if there is no uid', async () => {
    const { response } = await setupBookieTest({ uid: '' });

    expect(response).toEqual({
      error: true,
      message: 'user is not signed in.',
    });
  });

  it('returns an error if there is no lotId', async () => {
    const { response } = await setupBookieTest({ lotId: '' });

    expect(response).toEqual({
      error: true,
      message: 'please provide a lotId.',
    });
  });

  it('returns an error if there is no ticketCount', async () => {
    const { response } = await setupBookieTest({ ticketCount: 0 });

    expect(response).toEqual({
      error: true,
      message: 'please provide a ticket count > 0.',
    });
  });

  it('returns an error if there is no corresponding user', async () => {
    const { response } = await setupBookieTest({ isAuthUser: false });

    expect(response).toEqual({
      error: true,
      message: 'user does not exist.',
    });
  });

  it('returns an error if there is no corresponding lot', async () => {
    const { response } = await setupBookieTest({ lot: null });

    expect(response).toEqual({
      error: true,
      message: 'could not find this lot.',
    });
  });

  it('returns an error if there is no corresponding store', async () => {
    const { response } = await setupBookieTest({ store: null });

    expect(response).toEqual({
      error: true,
      message: 'could not find this store.',
    });
  });

  it('creates an invoice', async () => {
    const lotId = getUuid();
    const lot = makeLot({
      id: lotId,
      active: true,
      totalAvailableTickets: 100000,
    });
    const uid = getUuid();
    const ticketCount = 5;
    const store = { ...makeBtcPayServerStore({}), id: getUuid() };
    const ticketPriceUSD = 10;
    const invoicePaymentTotalUSD = numberToDigits(ticketCount * ticketPriceUSD);
    const invoicePaymentRate = 50000;
    const ticketPriceBTC = ticketPriceUSD / invoicePaymentRate;
    const tickets = arrayFromNumber(5).map(() =>
      makeTicket({ priceBTC: ticketPriceBTC }),
    );
    const invoice = makeBtcPayServerInvoice({
      amount: invoicePaymentTotalUSD.toString(),
      metadata: {
        ticketIds: tickets.map((ticket) => ticket.id),
        uid: getUuid(),
        lotId: getUuid(),
      },
    });
    const invoicePaymentAddress = getUuid();
    const invoicePaymentAmountBTC = ticketCount * ticketPriceBTC;
    const invoicePaymentExpiry = getTimeAsISOString(
      invoice.expirationTime * 1000,
    );

    const { response, dependencies } = await setupBookieTest({
      lotId,
      uid,
      ticketCount,
      lot,
      store,
      tickets,
      invoice,
      invoicePaymentAddress,
      invoicePaymentAmountBTC,
      invoicePaymentRate,
    });

    expect(dependencies.createInvoice).toHaveBeenCalledWith(
      store.id,
      makeBtcPayServerInvoicePayload({
        amount: invoicePaymentAmountBTC * invoicePaymentRate,
        uid,
        lotId: lot.id,
        ticketIds: [],
      }),
    );

    expect(dependencies.getInvoicePaymentMethods).toHaveBeenCalledWith({
      storeId: store.id,
      invoiceId: invoice.id,
    });

    expect(dependencies.createTickets).toHaveBeenCalledWith({
      lot,
      uid,
      ticketCount,
      ticketPriceBTC,
      invoiceId: invoice.id,
    });

    const ticketIds = tickets.map((ticket) => ticket.id);
    expect(dependencies.updateInvoice).toHaveBeenCalledWith(
      store.id,
      invoice.id,
      {
        metadata: {
          ...invoice.metadata,
          ticketIds,
        },
      },
    );

    expect(dependencies.firebaseCreateInvoice).toHaveBeenCalledWith(lot.id, {
      id: invoice.id,
      lotId,
      uid,
      address: invoicePaymentAddress,
      amountBTC: invoicePaymentAmountBTC,
      dateCreated: expect.any(String),
      rate: invoicePaymentRate,
      expiry: invoicePaymentExpiry,
      ticketIds,
      status: InvoiceStatus.reserved,
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
      data: invoice.id,
    });
  });
});
