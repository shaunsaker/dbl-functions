import { BagmanResponse, runBagman } from '.';
import { makeInvoice, makeLot } from '../../lots/data';
import { makeBtcPayServerInvoiceReceivedPaymentEventData } from '../../services/btcPayServer/data';
import { getUuid } from '../../utils/getUuid';

describe('bagman', () => {
  const getInvoice = jest.fn();
  const firebaseFetchLot = jest.fn();
  const firebaseFetchTickets = jest.fn();
  const markTicketsStatus = jest.fn();
  const saveTickets = jest.fn();
  const createTickets = jest.fn();
  const updateInvoice = jest.fn();

  it('returns an error when there is no storeId', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      invoiceId: getUuid(),
      value: 10,
      // @ts-expect-error we want to test bad data
      storeId: undefined,
    });
    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,

      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'storeId missing fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  it('returns an error when there is no invoiceId', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      value: 10,
      // @ts-expect-error we want to test bad data
      invoiceId: undefined,
    });
    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,
      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'invoiceId missing fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  it('returns an error when there is no matching invoice', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      invoiceId: getUuid(),
      value: 10,
    });

    // invoice is null because there is no match
    const invoice = null;
    getInvoice.mockReturnValue(invoice);

    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,
      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'Invoice missing fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  it('returns an error when there is no lotId in the invoice', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      invoiceId: getUuid(),
      value: 10,
    });

    const invoice = makeInvoice({
      metadata: {
        uid: getUuid(),
        ticketIds: [getUuid()],
        // @ts-expect-error  we want to test bad data
        lotId: null,
      },
    });
    getInvoice.mockReturnValue(invoice);

    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,
      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'lotId missing from invoice fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  it('returns an error when there is no uid in the invoice', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      invoiceId: getUuid(),
      value: 10,
    });

    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        ticketIds: [getUuid()],
        // @ts-expect-error  we want to test bad data
        uid: null,
      },
    });
    getInvoice.mockReturnValue(invoice);

    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,
      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'uid missing from invoice fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  it('returns an error when there are no ticketIds in the invoice', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      invoiceId: getUuid(),
      value: 10,
    });

    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        // @ts-expect-error  we want to test bad data
        ticketIds: null,
      },
    });
    getInvoice.mockReturnValue(invoice);

    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,
      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'ticketIds missing from invoice fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  it('returns an error when the ticketIds in the invoice are empty', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      invoiceId: getUuid(),
      value: 10,
    });

    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        ticketIds: [],
      },
    });
    getInvoice.mockReturnValue(invoice);

    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,
      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'ticketIds in invoice are empty fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  it('returns an error when there is no matching lot', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      invoiceId: getUuid(),
      value: 10,
    });

    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        ticketIds: [getUuid()],
      },
    });
    getInvoice.mockReturnValue(invoice);

    const lot = null;
    firebaseFetchLot.mockReturnValue(lot);

    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,
      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'Lot missing fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  it('returns an error when there are no reserved tickets', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      invoiceId: getUuid(),
      value: 10,
    });

    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        ticketIds: [getUuid()],
      },
    });
    getInvoice.mockReturnValue(invoice);

    const lot = makeLot({});
    firebaseFetchLot.mockReturnValue(lot);

    firebaseFetchTickets.mockReturnValue([]);

    const response = await runBagman(eventData, {
      getInvoice,
      firebaseFetchLot,
      firebaseFetchTickets,
      markTicketsStatus,
      saveTickets,
      createTickets,
      updateInvoice,
    });

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'Tickets missing fool.',
    };
    expect(response).toEqual(expectedResponse);
  });
});
