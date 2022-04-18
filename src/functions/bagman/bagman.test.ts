import { makeInvoice } from '../../lots/data';
import { getUuid } from '../../utils/getUuid';
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

  // it('handles single exact payment', async () => {
  //   const ticket = makeTicket({ status: TicketStatus.reserved });
  //   const tickets = [ticket];
  //   const lot = makeLot({});
  //   const invoice = makeInvoice({
  //     metadata: {
  //       lotId: lot.id,
  //       uid: getUuid(),
  //       ticketIds: tickets.map((ticket) => ticket.id),
  //     },
  //   });
  //   getInvoice.mockReturnValue(invoice);

  //   const userProfileData = makeUserProfileData({});
  //   firebaseFetchUserProfile.mockReturnValue(userProfileData);

  //   firebaseFetchLot.mockReturnValue(lot);

  //   firebaseFetchTickets.mockReturnValue(tickets);

  //   const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
  //     storeId: invoice.storeId,
  //     invoiceId: invoice.id,
  //     value: tickets.length * ticket.price * lot.BTCPriceInUSD,
  //   });
  //   const response = await runBagman(eventData, {
  //     getInvoice,
  //     firebaseFetchUserProfile,
  //     firebaseFetchLot,
  //     firebaseFetchTickets,
  //     markTicketsStatus,
  //     saveTickets,
  //     createTickets,
  //     updateInvoice,
  //     firebaseSendNotification,
  //   });

  //   expect(saveTickets).toHaveBeenCalledWith(
  //     lot.id,
  //     markTicketsStatus(tickets, TicketStatus.paymentReceived),
  //   );

  //   expect(firebaseSendNotification).toHaveBeenCalledWith({
  //     title: `We've just received payment of ${
  //       tickets.length * ticket.price
  //     } BTC from you 😎`,
  //     body: "This was enough for 1 ticket. Once your transaction has received 6 confirmations on the blockchain, we'll enter your ticket into today's draw 🤞",
  //     token: userProfileData.fcmTokens[0],
  //   });

  //   const expectedResponse: BagmanResponse = {
  //     error: false,
  //     message: 'Great Success! 1 ticket was marked as paymentReceived.',
  //   };
  //   expect(response).toEqual(expectedResponse);
  // });

  // it('handles multiple exact payments', async () => {
  //   const ticket1 = makeTicket({ status: TicketStatus.reserved });
  //   const ticket2 = makeTicket({ status: TicketStatus.reserved });
  //   const tickets = [ticket1, ticket2];
  //   const lot = makeLot({});
  //   const invoice = makeInvoice({
  //     metadata: {
  //       lotId: lot.id,
  //       uid: getUuid(),
  //       ticketIds: tickets.map((ticket) => ticket.id),
  //     },
  //   });
  //   getInvoice.mockReturnValue(invoice);

  //   const userProfileData = makeUserProfileData({});
  //   firebaseFetchUserProfile.mockReturnValue(userProfileData);

  //   firebaseFetchLot.mockReturnValue(lot);

  //   firebaseFetchTickets.mockReturnValue([ticket1, ticket2]);

  //   const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
  //     storeId: invoice.storeId,
  //     invoiceId: invoice.id,
  //     value: tickets.length * ticket1.price * lot.BTCPriceInUSD,
  //   });
  //   const response = await runBagman(eventData, {
  //     getInvoice,
  //     firebaseFetchUserProfile,
  //     firebaseFetchLot,
  //     firebaseFetchTickets,
  //     markTicketsStatus,
  //     saveTickets,
  //     createTickets,
  //     updateInvoice,
  //     firebaseSendNotification,
  //   });

  //   expect(saveTickets).toHaveBeenCalledWith(
  //     lot.id,
  //     markTicketsStatus(tickets, TicketStatus.paymentReceived),
  //   );

  //   expect(firebaseSendNotification).toHaveBeenCalledWith({
  //     title: `We've just received payment of ${
  //       tickets.length * tickets[0].price
  //     } BTC from you 😎`,
  //     body: "This was enough for 2 tickets. Once your transaction has received 6 confirmations on the blockchain, we'll enter your tickets into today's draw 🤞",
  //     token: userProfileData.fcmTokens[0],
  //   });

  //   const expectedResponse: BagmanResponse = {
  //     error: false,
  //     message: 'Great Success! 2 tickets were marked as paymentReceived.',
  //   };
  //   expect(response).toEqual(expectedResponse);
  // });

  // it('handles under payments when they can afford at least one ticket', async () => {
  //   const ticket1 = makeTicket({ status: TicketStatus.reserved });
  //   const ticket2 = makeTicket({ status: TicketStatus.reserved });
  //   const tickets = [ticket1, ticket2];
  //   const lot = makeLot({});
  //   const invoice = makeInvoice({
  //     metadata: {
  //       lotId: lot.id,
  //       uid: getUuid(),
  //       ticketIds: tickets.map((ticket) => ticket.id),
  //     },
  //   });
  //   getInvoice.mockReturnValue(invoice);

  //   const userProfileData = makeUserProfileData({});
  //   firebaseFetchUserProfile.mockReturnValue(userProfileData);

  //   firebaseFetchLot.mockReturnValue(lot);

  //   // we still return both tickets even though the invoice was underpaid
  //   firebaseFetchTickets.mockReturnValue(tickets);

  //   const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
  //     storeId: invoice.storeId,
  //     invoiceId: invoice.id,
  //     value: ticket1.price * lot.BTCPriceInUSD, // only enough for one ticket
  //   });
  //   const response = await runBagman(eventData, {
  //     getInvoice,
  //     firebaseFetchUserProfile,
  //     firebaseFetchLot,
  //     firebaseFetchTickets,
  //     markTicketsStatus,
  //     saveTickets,
  //     createTickets,
  //     updateInvoice,
  //     firebaseSendNotification,
  //   });

  //   expect(saveTickets).toHaveBeenCalledWith(
  //     lot.id,
  //     markTicketsStatus([ticket1], TicketStatus.paymentReceived),
  //   );

  //   expect(firebaseSendNotification).toHaveBeenCalledWith({
  //     title: `We've just received payment of ${ticket1.price} BTC from you 😎`,
  //     body: "This was enough for 1 ticket. Once your transaction has received 6 confirmations on the blockchain, we'll enter your ticket into today's draw 🤞",
  //     token: userProfileData.fcmTokens[0],
  //   });

  //   const expectedResponse: BagmanResponse = {
  //     error: false,
  //     message: 'Great Success! 1 ticket was marked as paymentReceived.',
  //   };
  //   expect(response).toEqual(expectedResponse);
  // });

  // it('handles under payments when they cant afford any tickets', async () => {
  //   const ticket1 = makeTicket({ status: TicketStatus.reserved });
  //   const tickets = [ticket1];
  //   const lot = makeLot({});
  //   const invoice = makeInvoice({
  //     metadata: {
  //       lotId: lot.id,
  //       uid: getUuid(),
  //       ticketIds: tickets.map((ticket) => ticket.id),
  //     },
  //   });
  //   getInvoice.mockReturnValue(invoice);

  //   const userProfileData = makeUserProfileData({});
  //   firebaseFetchUserProfile.mockReturnValue(userProfileData);

  //   firebaseFetchLot.mockReturnValue(lot);

  //   // we still return both tickets even though the invoice was underpaid
  //   firebaseFetchTickets.mockReturnValue(tickets);

  //   const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
  //     storeId: invoice.storeId,
  //     invoiceId: invoice.id,
  //     value: (ticket1.price * lot.BTCPriceInUSD) / 2, // not enough for one ticket
  //   });
  //   const response = await runBagman(eventData, {
  //     getInvoice,
  //     firebaseFetchUserProfile,
  //     firebaseFetchLot,
  //     firebaseFetchTickets,
  //     markTicketsStatus,
  //     saveTickets,
  //     createTickets,
  //     updateInvoice,
  //     firebaseSendNotification,
  //   });

  //   expect(saveTickets).toHaveBeenCalledWith(
  //     lot.id,
  //     [], // no tickets
  //   );

  //   expect(firebaseSendNotification).toHaveBeenCalledWith({
  //     title: `We've just received payment of ${
  //       parseFloat(eventData.payment.value) / lot.BTCPriceInUSD
  //     } BTC from you 😎`,
  //     body: "Unfortunately, this wasn't enough for any of your reserved tickets. Please deposit more.",
  //     token: userProfileData.fcmTokens[0],
  //   });

  //   const expectedResponse: BagmanResponse = {
  //     error: false,
  //     message: 'Epic Fail! User could not afford any tickets.',
  //   };
  //   expect(response).toEqual(expectedResponse);
  // });
});
