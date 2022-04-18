import { getBagmanNotification, getBagmanSuccessMessage } from '.';
import { makeInvoice, makeLot, makeTicket } from '../../lots/data';
import { TicketStatus } from '../../lots/models';
import { makeUserProfileData } from '../../userProfile/data';
import { getUuid } from '../../utils/getUuid';
import { markTicketsStatus } from '../markTicketsStatus';
import { setupBagmanTest } from './bagman.testUtils';

describe('bagman', () => {
  it('returns an error when there is no storeId', async () => {
    const { response } = await setupBagmanTest({
      storeId: '',
    });

    expect(response).toEqual({
      error: true,
      message: 'storeId missing fool.',
    });
  });

  it('returns an error when there is no invoiceId', async () => {
    const { response } = await setupBagmanTest({
      storeId: getUuid(),
      invoiceId: '',
    });

    expect(response).toEqual({
      error: true,
      message: 'invoiceId missing fool.',
    });
  });

  it('returns an error when there is no matching invoice', async () => {
    const { response } = await setupBagmanTest({
      storeId: getUuid(),
      invoiceId: getUuid(),
      invoice: null,
    });

    expect(response).toEqual({
      error: true,
      message: 'Invoice missing fool.',
    });
  });

  it('returns an error when there is no lotId in the invoice', async () => {
    const invoice = makeInvoice({
      metadata: { lotId: '', uid: getUuid(), ticketIds: [getUuid()] },
    });
    const { response } = await setupBagmanTest({ invoice });

    expect(response).toEqual({
      error: true,
      message: 'lotId missing from invoice fool.',
    });
  });

  it('returns an error when there is no uid in the invoice', async () => {
    const invoice = makeInvoice({
      metadata: { lotId: getUuid(), uid: '', ticketIds: [getUuid()] },
    });
    const { response } = await setupBagmanTest({ invoice });

    expect(response).toEqual({
      error: true,
      message: 'uid missing from invoice fool.',
    });
  });

  it('returns an error when there are no ticketIds in the invoice', async () => {
    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        // @ts-expect-error mocked
        ticketIds: null,
      },
    });
    const { response } = await setupBagmanTest({ invoice });

    expect(response).toEqual({
      error: true,
      message: 'ticketIds missing from invoice fool.',
    });
  });

  it('returns an error when there the ticketIds in the invoice are empty', async () => {
    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        ticketIds: [],
      },
    });
    const { response } = await setupBagmanTest({ invoice });

    expect(response).toEqual({
      error: true,
      message: 'ticketIds in invoice are empty fool.',
    });
  });

  it('returns an error when there is no user data', async () => {
    const { response } = await setupBagmanTest({ userProfileData: null });

    expect(response).toEqual({
      error: true,
      message: 'User data missing fool.',
    });
  });

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
    const userProfileData = makeUserProfileData({});
    const lot = makeLot({});
    const tickets = [
      makeTicket({
        price: lot.ticketPriceInBTC,
        status: TicketStatus.reserved,
      }),
    ];
    const invoice = makeInvoice({
      metadata: {
        lotId: lot.id,
        uid: getUuid(),
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    });
    const paymentAmountBTC = lot.ticketPriceInBTC;
    const { response, saveTickets, firebaseSendNotification } =
      await setupBagmanTest({
        userProfileData,
        lot,
        tickets,
        invoice,
        paymentValueUSD: paymentAmountBTC * lot.BTCPriceInUSD,
      });

    const expectedPaidTickets = markTicketsStatus(
      tickets,
      TicketStatus.paymentReceived,
    );
    expect(saveTickets).toHaveBeenCalledWith(lot.id, expectedPaidTickets);

    expect(firebaseSendNotification).toHaveBeenCalledWith(
      getBagmanNotification({
        paymentAmountBTC: paymentAmountBTC,
        paidTickets: expectedPaidTickets,
        fcmToken: userProfileData.fcmTokens[0],
      }),
    );

    expect(response).toEqual({
      error: false,
      message: getBagmanSuccessMessage(expectedPaidTickets),
    });
  });

  it('handles multiple exact payments', async () => {
    const userProfileData = makeUserProfileData({});
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
    const invoice = makeInvoice({
      metadata: {
        lotId: lot.id,
        uid: getUuid(),
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    });
    const paymentAmountBTC = 2 * lot.ticketPriceInBTC;
    const { response, saveTickets, firebaseSendNotification } =
      await setupBagmanTest({
        userProfileData,
        lot,
        tickets,
        invoice,
        paymentValueUSD: paymentAmountBTC * lot.BTCPriceInUSD,
      });

    const expectedPaidTickets = markTicketsStatus(
      tickets,
      TicketStatus.paymentReceived,
    );
    expect(saveTickets).toHaveBeenCalledWith(lot.id, expectedPaidTickets);

    expect(firebaseSendNotification).toHaveBeenCalledWith(
      getBagmanNotification({
        paymentAmountBTC,
        paidTickets: expectedPaidTickets,
        fcmToken: userProfileData.fcmTokens[0],
      }),
    );

    expect(response).toEqual({
      error: false,
      message: getBagmanSuccessMessage(expectedPaidTickets),
    });
  });

  it('handles under payments when they can afford at least one ticket', async () => {
    const userProfileData = makeUserProfileData({});
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
    const invoice = makeInvoice({
      metadata: {
        lotId: lot.id,
        uid: getUuid(),
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    });
    const paymentAmountBTC = lot.ticketPriceInBTC; // only 1 of the 2
    const { response, saveTickets, firebaseSendNotification } =
      await setupBagmanTest({
        userProfileData,
        lot,
        tickets,
        invoice,
        paymentValueUSD: paymentAmountBTC * lot.BTCPriceInUSD,
      });

    const expectedPaidTickets = markTicketsStatus(
      [tickets[0]], // only 1 of the 2
      TicketStatus.paymentReceived,
    );
    expect(saveTickets).toHaveBeenCalledWith(lot.id, expectedPaidTickets);

    expect(firebaseSendNotification).toHaveBeenCalledWith(
      getBagmanNotification({
        paymentAmountBTC,
        paidTickets: expectedPaidTickets,
        fcmToken: userProfileData.fcmTokens[0],
      }),
    );

    expect(response).toEqual({
      error: false,
      message: getBagmanSuccessMessage(expectedPaidTickets),
    });
  });

  it('handles under payments when they cant afford any tickets', async () => {
    const userProfileData = makeUserProfileData({});
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
    const invoice = makeInvoice({
      metadata: {
        lotId: lot.id,
        uid: getUuid(),
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    });
    const paymentAmountBTC = lot.ticketPriceInBTC / 2; // only 1/2 a ticket
    const { response, saveTickets, firebaseSendNotification } =
      await setupBagmanTest({
        userProfileData,
        lot,
        tickets,
        invoice,
        paymentValueUSD: paymentAmountBTC * lot.BTCPriceInUSD,
      });

    const expectedPaidTickets = markTicketsStatus(
      [], // only paid for half a ticket, we should not be saving anything
      TicketStatus.paymentReceived,
    );
    expect(saveTickets).toHaveBeenCalledWith(lot.id, expectedPaidTickets);

    expect(firebaseSendNotification).toHaveBeenCalledWith(
      getBagmanNotification({
        paymentAmountBTC,
        paidTickets: expectedPaidTickets,
        fcmToken: userProfileData.fcmTokens[0],
      }),
    );

    expect(response).toEqual({
      error: false,
      message: getBagmanSuccessMessage(expectedPaidTickets),
    });
  });
});
