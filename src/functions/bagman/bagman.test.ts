import { getBagmanNotification } from '.';
import { makeLot } from '../../store/lots/data';
import { makeBtcPayServerInvoice } from '../../services/btcPayServer/data';
import { getUuid } from '../../utils/getUuid';
import { setupBagmanTest } from './bagman.testUtils';
import { InvoiceStatus } from '../../store/invoices/models';

describe('bagman', () => {
  it('returns an error when there is no matching lot', async () => {
    const { response } = await setupBagmanTest({ lot: null });

    expect(response).toEqual({
      error: true,
      message: 'lot missing fool.',
    });
  });

  it('handles a single exact payment', async () => {
    const lot = makeLot({
      id: getUuid(),
      active: true,
      totalAvailableTickets: 100000,
    });
    const ticketPriceBTC = 0.00025;
    const uid = getUuid();
    const ticketIds = [getUuid(), getUuid(), getUuid()];
    const invoice = makeBtcPayServerInvoice({
      metadata: {
        lotId: lot.id,
        uid,
        ticketIds,
      },
    });
    const paymentAmountBTC = ticketPriceBTC;
    const invoiceTotalBTC = paymentAmountBTC;
    const { response, dependencies } = await setupBagmanTest({
      lot,
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

    expect(dependencies.firebaseUpdateInvoice).toHaveBeenCalledWith({
      lotId: lot.id,
      invoiceId: invoice.id,
      data: { status: InvoiceStatus.paymentReceived },
    });

    expect(dependencies.notifyUser).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        hasPaidInFull: true,
        paymentAmountBTC,
        totalPaidBTC: paymentAmountBTC,
        invoiceTotalBTC: paymentAmountBTC,
        paidTicketCount: ticketIds.length,
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
    const ticketIds = [getUuid(), getUuid(), getUuid()];
    const uid = getUuid();
    const invoice = makeBtcPayServerInvoice({
      metadata: {
        lotId: lot.id,
        uid,
        ticketIds,
      },
    });
    const paymentAmountBTC = 2 * ticketPriceBTC;
    const invoiceTotalBTC = paymentAmountBTC;
    const { response, dependencies } = await setupBagmanTest({
      lot,
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

    expect(dependencies.firebaseUpdateInvoice).toHaveBeenCalledWith({
      lotId: lot.id,
      invoiceId: invoice.id,
      data: { status: InvoiceStatus.paymentReceived },
    });

    expect(dependencies.notifyUser).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        hasPaidInFull: true,
        paymentAmountBTC,
        totalPaidBTC: paymentAmountBTC,
        invoiceTotalBTC: paymentAmountBTC,
        paidTicketCount: ticketIds.length,
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
    const ticketIds = [getUuid(), getUuid(), getUuid()];
    const uid = getUuid();
    const invoice = makeBtcPayServerInvoice({
      metadata: {
        lotId: lot.id,
        uid,
        ticketIds,
      },
    });
    const paymentAmountBTC = ticketPriceBTC; // only 1 of the 2
    const invoiceTotalBTC = ticketPriceBTC * 2;
    const { dependencies } = await setupBagmanTest({
      lot,
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

    expect(dependencies.firebaseUpdateInvoice).not.toHaveBeenCalledWith({
      lotId: lot.id,
      invoiceId: invoice.id,
      data: { status: InvoiceStatus.paymentReceived },
    });

    expect(dependencies.notifyUser).toHaveBeenCalledWith({
      uid,
      notification: getBagmanNotification({
        hasPaidInFull: false,
        paymentAmountBTC,
        totalPaidBTC: paymentAmountBTC,
        invoiceTotalBTC,
        paidTicketCount: ticketIds.length,
      }),
    });
  });
});
