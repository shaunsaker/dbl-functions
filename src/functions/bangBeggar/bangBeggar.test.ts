import { getBangBeggarNotification } from '.';
import { makeLot } from '../../store/lots/data';
import { makeBtcPayServerInvoice } from '../../services/btcPayServer/data';
import { getUuid } from '../../utils/getUuid';
import { setupBangBeggarTest } from './bangBeggar.testUtils';
import { InvoiceStatus } from '../../store/invoices/models';

describe('bangBeggar', () => {
  it('expires invoices', async () => {
    const lot = makeLot({
      id: getUuid(),
      active: true,
      totalAvailableTickets: 100000,
    });
    const uid = getUuid();
    const ticketIds = [getUuid(), getUuid(), getUuid()];
    const invoice = makeBtcPayServerInvoice({
      metadata: {
        lotId: lot.id,
        uid,
        ticketIds,
      },
    });
    const { response, dependencies } = await setupBangBeggarTest({
      invoice,
    });

    expect(dependencies.firebaseUpdateInvoice).toHaveBeenCalledWith({
      lotId: lot.id,
      invoiceId: invoice.id,
      data: { status: InvoiceStatus.expired },
    });

    expect(dependencies.notifyUser).toHaveBeenCalledWith({
      uid,
      notification: getBangBeggarNotification({
        expiredTicketCount: ticketIds.length,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });
});
