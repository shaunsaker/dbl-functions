import { runBusker } from '.';
import { makeInvoice } from '../../store/invoices/data';
import { Invoice } from '../../store/invoices/models';
import { makeLot } from '../../store/lots/data';
import { Lot } from '../../store/lots/models';
import { getUuid } from '../../utils/getUuid';

export const setupBuskerTest = async ({
  lotId = getUuid(),
  invoiceBefore = makeInvoice({}),
  invoiceAfter = makeInvoice({}),
  lot = makeLot({ id: getUuid(), active: true, totalAvailableTickets: 100000 }),
}: {
  lotId?: string;
  invoiceBefore?: Invoice | undefined;
  invoiceAfter?: Invoice | undefined;
  lot?: Lot | null;
}) => {
  const firebaseFetchLot = jest.fn();
  const firebaseUpdateLot = jest.fn();

  if (lot) {
    firebaseFetchLot.mockReturnValue(lot);
  }

  const dependencies = {
    firebaseFetchLot,
    firebaseUpdateLot,
  };
  const response = await runBusker({
    lotId,
    invoiceBefore,
    invoiceAfter,
    dependencies,
  });

  return { response, dependencies };
};
