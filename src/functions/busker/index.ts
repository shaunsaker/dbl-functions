import * as functions from 'firebase-functions';
import { Lot, LotId, Ticket, TicketStatus } from '../../lots/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { FirebaseFunctionResponse } from '../../services/firebase/models';

// NOTE: this covers a lot of scenarios and looks complicated, see tests for clarity
export const getLotStats = ({
  lot,
  ticketBefore,
  ticketAfter,
}: {
  lot: Lot;
  ticketBefore: Ticket | undefined;
  ticketAfter: Ticket | undefined;
}) => {
  let newTicketsAvailable = lot.ticketsAvailable;
  let newConfirmedTicketCount = lot.confirmedTicketCount;
  let newTotalInBTC = lot.totalInBTC;

  const ticketWasAdded = !ticketBefore;
  const ticketWasDeleted = !ticketAfter;
  const ticketChanged = !ticketWasAdded && !ticketWasDeleted;

  if (ticketWasAdded) {
    // reserved ✅
    // paymentReceived ✅
    // confirmed ✅
    // expired ⛔
    const newTicketIsNotExpired = ticketAfter?.status !== TicketStatus.expired;
    const newTicketIsConfirmed = ticketAfter?.status === TicketStatus.confirmed;

    // if any ticket besides an expired one was added
    if (newTicketIsNotExpired) {
      newTicketsAvailable -= 1;

      // if a confirmed ticket was added also do the following
      if (newTicketIsConfirmed) {
        newConfirmedTicketCount += 1;
        newTotalInBTC += lot.ticketPriceInBTC;
      }
    }
  } else if (ticketWasDeleted) {
    // reserved ✅
    // paymentReceived ✅
    // confirmed ✅
    // expired ⛔
    const ticketWasNotExpired = ticketBefore?.status !== TicketStatus.expired;
    const ticketWasConfirmed = ticketBefore?.status === TicketStatus.confirmed;

    if (ticketWasNotExpired) {
      newTicketsAvailable += 1;

      if (ticketWasConfirmed) {
        newConfirmedTicketCount -= 1;
        newTotalInBTC -= lot.ticketPriceInBTC;
      }
    }
  } else if (ticketChanged) {
    // SUMMARY: we only act if:
    // a ticket became confirmed/expired
    // a ticket changed from confirmed/expired
    //
    // reserved => reserved ⛔
    // reserved => paymentReceived ⛔
    // reserved => confirmed ✅
    // reserved => expired ✅
    // paymentReceived => reserved ⛔
    // paymentReceived => paymentReceived ⛔
    // paymentReceived => confirmed ✅
    // paymentReceived => expired ✅
    // confirmed => reserved ✅
    // confirmed => paymentReceived ✅
    // confirmed => confirmed ⛔
    // confirmed => expired ✅
    // expired => reserved  ✅
    // expired => paymentReceived  ✅
    // expired => confirmed ✅
    // expired => expired ⛔

    const ticketWasConfirmed = ticketBefore.status === TicketStatus.confirmed;
    const ticketWasExpired = ticketBefore.status === TicketStatus.expired;
    const ticketIsConfirmed = ticketAfter.status === TicketStatus.confirmed;
    const ticketIsExpired = ticketAfter.status === TicketStatus.expired;
    const ticketBecameConfirmed = !ticketWasConfirmed && ticketIsConfirmed;
    const ticketBecameExpired =
      !ticketWasExpired && ticketAfter.status === TicketStatus.expired;

    if (ticketBecameConfirmed) {
      newConfirmedTicketCount += 1;
      newTotalInBTC += lot.ticketPriceInBTC;

      if (ticketWasExpired) {
        newTicketsAvailable -= 1;
      }
    } else if (ticketBecameExpired) {
      newTicketsAvailable += 1;

      if (ticketWasConfirmed) {
        newConfirmedTicketCount -= 1;
        newTotalInBTC -= lot.ticketPriceInBTC;
      }
    } else if (ticketWasConfirmed && !ticketIsConfirmed) {
      newConfirmedTicketCount -= 1;
      newTotalInBTC -= lot.ticketPriceInBTC;
    } else if (ticketWasExpired && !ticketIsExpired) {
      newTicketsAvailable -= 1;
    }
  }

  const newLotStats = {
    ticketsAvailable: newTicketsAvailable,
    confirmedTicketCount: newConfirmedTicketCount,
    totalInBTC: newTotalInBTC,
  };

  return newLotStats;
};

type Response = FirebaseFunctionResponse<void>;

// when a lot's tickets change, ie. status change, it's added, it's removed
// we need to update that lot's stats, ie. ticketsAvailable, confirmedTicketCount, totalInBTC
export const runBusker = async ({
  lotId,
  ticketBefore,
  ticketAfter,
}: {
  lotId: LotId;
  ticketBefore: Ticket | undefined;
  ticketAfter: Ticket | undefined;
}): Promise<Response> => {
  // fetch the lot
  const lot = await firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Lot missing fool.',
      data: undefined,
    };
  }

  const newLotStats = getLotStats({ lot, ticketBefore, ticketAfter });

  // TODO:  we should verify the totalInBTC and notify admin of any discrepencies

  await firebaseUpdateLot(lotId, newLotStats);

  return {
    error: false,
    message: 'Great Success!',
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
