import { makeInvoice, makeLot, makeTicket } from '../../lots/data';
import { makeBtcPayServerInvoicePayload } from '../../services/btcPayServer/data';
import { makeBtcPayServerStore } from '../../services/btcPayServer/data';
import { arrayFromNumber } from '../../utils/arrayFromNumber';
import { getUuid } from '../../utils/getUuid';
import { setupBookieTest } from './bookie.testUtils';

describe('bookie', () => {
  it('returns an error if there is no uid', async () => {
    const { response } = await setupBookieTest({ uid: '' });

    expect(response).toEqual({
      error: true,
      message: 'User is not signed in.',
    });
  });

  it('returns an error if there is no lotId', async () => {
    const { response } = await setupBookieTest({ lotId: '' });

    expect(response).toEqual({
      error: true,
      message: 'Please provide a lotId.',
    });
  });

  it('returns an error if there is no ticketCount', async () => {
    const { response } = await setupBookieTest({ ticketCount: 0 });

    expect(response).toEqual({
      error: true,
      message: 'Please provide a ticketCount greater than 0.',
    });
  });

  it('returns an error if there is no corresponding user', async () => {
    const { response } = await setupBookieTest({ isAuthUser: false });

    expect(response).toEqual({
      error: true,
      message: 'User does not exist.',
    });
  });

  it('returns an error if there is no corresponding lot', async () => {
    const { response } = await setupBookieTest({ lot: null });

    expect(response).toEqual({
      error: true,
      message: 'Could not find this lot.',
    });
  });

  it('returns an error if there is no corresponding store', async () => {
    const { response } = await setupBookieTest({ store: null });

    expect(response).toEqual({
      error: true,
      message: 'Could not find this store.',
    });
  });

  it('creates an invoice', async () => {
    const lotId = getUuid();
    const lot = makeLot({ id: lotId });
    const uid = getUuid();
    const ticketCount = 5;
    const store = { ...makeBtcPayServerStore({}), id: getUuid() };
    const tickets = arrayFromNumber(5).map(() => makeTicket({}));
    const invoice = makeInvoice({
      metadata: {
        ticketIds: tickets.map((ticket) => ticket.id),
        uid: getUuid(),
        lotId: getUuid(),
      },
    });
    const { response, dependencies } = await setupBookieTest({
      lotId,
      uid,
      ticketCount,
      lot,
      store,
      tickets,
      invoice,
    });

    expect(dependencies.createTickets).toHaveBeenCalledWith({
      lot,
      uid,
      ticketCount,
    });

    expect(dependencies.createInvoice).toHaveBeenCalledWith(
      store.id,
      makeBtcPayServerInvoicePayload({
        amount: ticketCount * lot.ticketPriceInBTC * lot.BTCPriceInUSD,
        uid,
        lotId: lot.id,
        ticketIds: tickets.map((ticket) => ticket.id),
      }),
    );

    expect(response).toEqual({
      error: false,
      message: 'Great success!',
      data: invoice,
    });
  });
});
