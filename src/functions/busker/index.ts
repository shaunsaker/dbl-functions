import * as functions from 'firebase-functions';
import { LotId, Ticket } from '../../lots/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { getLotStats } from './getLotStats';

type Response = FirebaseFunctionResponse<void>;

// when a lot's tickets change, ie. status change, it's added, it's removed
// we need to update that lot's stats, ie. ticketsAvailable, confirmedTicketCount, totalInBTC
export const runBusker = async ({
  lotId,
  ticketBefore,
  ticketAfter,
  dependencies = {
    firebaseFetchLot,
    firebaseUpdateLot,
  },
}: {
  lotId: LotId;
  ticketBefore: Ticket | undefined;
  ticketAfter: Ticket | undefined;
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

  const newLotStats = getLotStats({ lot, ticketBefore, ticketAfter });

  await dependencies.firebaseUpdateLot(lotId, newLotStats);

  return {
    error: false,
    message: 'great success!',
    data: undefined,
  };
};

const busker = functions.firestore
  .document('lots/{lotId}/tickets/{ticketId}')
  .onWrite(async (change, context): Promise<Response> => {
    const { lotId } = context.params;

    return await runBusker({
      lotId,
      ticketBefore: change.before.data() as Ticket | undefined,
      ticketAfter: change.after.data() as Ticket | undefined,
    });
  });

export { busker };
