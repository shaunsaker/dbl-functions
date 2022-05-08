import { makeInvoice } from '../../store/invoices/data';
import { InvoiceStatus } from '../../store/invoices/models';
import { makeLot } from '../../store/lots/data';
import { getUuid } from '../../utils/getUuid';
import { setupBuskerTest } from './busker.testUtils';
import { getLotStats } from './getLotStats';

describe('busker', () => {
  it('returns an error if there is no lot', async () => {
    const { response, dependencies } = await setupBuskerTest({ lot: null });

    expect(dependencies.firebaseFetchLot).toHaveBeenCalled();
    expect(response).toEqual({
      error: true,
      message: 'lot missing fool.',
      data: undefined,
    });
  });

  it('updates the lot stats', async () => {
    const lotId = getUuid();
    const lot = makeLot({
      id: lotId,
      active: true,
      totalAvailableTickets: 100000,
    });
    const invoiceBefore = makeInvoice({ status: InvoiceStatus.reserved });
    const invoiceAfter = makeInvoice({ status: InvoiceStatus.confirmed }); // add a confirmed ticket
    const { response, dependencies } = await setupBuskerTest({
      lotId,
      lot,
      invoiceBefore,
      invoiceAfter,
    });

    expect(dependencies.firebaseFetchLot).toHaveBeenCalled();
    expect(dependencies.firebaseUpdateLot).toHaveBeenCalledWith(
      lotId,
      getLotStats({ lot, invoiceBefore, invoiceAfter }),
    );
    expect(response).toEqual({
      error: false,
      message: 'great success!',
      data: undefined,
    });
  });
});
