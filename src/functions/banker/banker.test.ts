import { getBankerNotification } from '.';
import { makeLot } from '../../store/lots/data';
import { makeBtcPayServerInvoice } from '../../services/btcPayServer/data';
import { getUuid } from '../../utils/getUuid';
import { setupBankerTest } from './banker.testUtils';
import { InvoiceStatus } from '../../store/invoices/models';

describe('banker', () => {
  it('confirms tickets', async () => {
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
    const { response, dependencies } = await setupBankerTest({
      invoice,
    });

    expect(dependencies.firebaseUpdateInvoice).toHaveBeenCalledWith({
      lotId: lot.id,
      invoiceId: invoice.id,
      data: { status: InvoiceStatus.confirmed },
    });

    expect(dependencies.sendNotification).toHaveBeenCalledWith({
      uid,
      notification: getBankerNotification({
        confirmedTicketCount: ticketIds.length,
      }),
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });
});
