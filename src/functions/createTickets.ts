import { Lot, Ticket, TicketId, TicketStatus, UserId } from '../models';
import { firebase } from '../services/firebase';
import { firebaseFetchTickets } from '../services/firebase/firebaseFetchTickets';
import { firebaseWriteBatch } from '../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../services/firebase/models';
import { arrayFromNumber } from '../utils/arrayFromNumber';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';

export const createTickets = async ({
  lot,
  uid,
  ticketCount,
  ticketPriceInBTC,
  ticketStatus,
}: {
  lot: Lot;
  uid: UserId;
  ticketCount: number;
  ticketPriceInBTC: number;
  ticketStatus: TicketStatus;
}): Promise<FirebaseFunctionResponse<TicketId[]>> => {
  // validate against ticketsAvailable
  // TODO: SS if tickets in today's lot are not available, we should buy in tomorrow's lot
  if (ticketCount > lot.ticketsAvailable) {
    return {
      error: true,
      message: `There are only ${lot.ticketsAvailable} and you are attempting to reserve ${ticketCount} tickets. Please try again with ${lot.ticketsAvailable} tickets.`,
      data: undefined,
    };
  }

  // validate against perUserTicketLimit
  const existingUserTicketCount = (
    await firebaseFetchTickets({ lotId: lot.id, uid })
  ).length;
  const remainingUserTicketLimit =
    lot.perUserTicketLimit - existingUserTicketCount;

  if (ticketCount > remainingUserTicketLimit) {
    return {
      error: true,
      message: `By reserving these tickets you'll reach the user ticket limit of ${lot.perUserTicketLimit}. Please try again using your remaininig ticket limit of ${remainingUserTicketLimit}.`,
      data: undefined,
    };
  }

  const ticketDocs = arrayFromNumber(ticketCount).map(() => {
    const id = getUuid();
    const ticket: Ticket = {
      id,
      uid,
      price: ticketPriceInBTC,
      status: ticketStatus,
      dateCreated: getTimeAsISOString(),
    };

    return {
      ref: firebase
        .firestore()
        .collection('lots')
        .doc(lot.id)
        .collection('tickets')
        .doc(id),
      data: ticket,
    };
  });

  await firebaseWriteBatch(ticketDocs);

  const ticketIds = ticketDocs.map((ticket) => ticket.data.id);

  return {
    error: false,
    message: 'Success',
    data: ticketIds,
  };
};
