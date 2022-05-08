import * as functions from 'firebase-functions';
import { LotId } from '../../store/lots/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { getLotStats } from './getLotStats';
import { Invoice } from '../../store/invoices/models';

type Response = FirebaseFunctionResponse<void>;

// when a lot's invoices change, ie. it's status changed, it's added, it's removed
// we need to update that lot's stats, ie. totalAvailableTickets, totalConfirmedTickets, totalBTC
export const runBusker = async ({
  lotId,
  invoiceBefore,
  invoiceAfter,
  dependencies = {
    firebaseFetchLot,
    firebaseUpdateLot,
  },
}: {
  lotId: LotId;
  invoiceBefore: Invoice | undefined;
  invoiceAfter: Invoice | undefined;
  dependencies?: {
    firebaseFetchLot: typeof firebaseFetchLot;
    firebaseUpdateLot: typeof firebaseUpdateLot;
  };
}): Promise<Response> => {
  // fetch the lot
  const lot = await dependencies.firebaseFetchLot(lotId);

  if (!lot) {
    // should not happen
    const message = `lot missing fool.`;

    console.log(`busker: ${message}`);

    return {
      error: true,
      message,
    };
  }

  const newLotStats = getLotStats({ lot, invoiceBefore, invoiceAfter });

  await dependencies.firebaseUpdateLot(lotId, newLotStats);

  return {
    error: false,
    message: 'great success!',
    data: undefined,
  };
};

const busker = functions
  .region('europe-west1')
  .firestore.document('lots/{lotId}/invoices/{invoiceId}')
  .onWrite(async (change, context): Promise<Response> => {
    const { lotId } = context.params;

    return await runBusker({
      lotId,
      invoiceBefore: change.before.data() as Invoice | undefined,
      invoiceAfter: change.after.data() as Invoice | undefined,
    });
  });

export { busker };
