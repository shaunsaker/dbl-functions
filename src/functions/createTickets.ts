import { makeTicket } from '../lots/data';
import { Lot, TicketId } from '../lots/models';
import { firebase } from '../services/firebase';
import { firebaseFetchTickets } from '../services/firebase/firebaseFetchTickets';
import { firebaseWriteBatch } from '../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../services/firebase/models';
import { UserId } from '../userProfile/models';
import { arrayFromNumber } from '../utils/arrayFromNumber';
import { getUuid } from '../utils/getUuid';

export const getNotEnoughTicketsAvailableResponse = ({
  ticketCount,
  ticketsAvailable,
}: {
  ticketCount: number;
  ticketsAvailable: number;
}) => ({
  error: true,
  message: `There are only ${ticketsAvailable} and you are attempting to reserve ${ticketCount} tickets. Please try again with ${ticketsAvailable} tickets.`,
});

export const getReachedUserTicketLimitResponse = ({
  existingUserTicketCount,
  perUserTicketLimit,
}: {
  existingUserTicketCount: number;
  perUserTicketLimit: number;
}) => {
  const remainingUserTicketLimit = perUserTicketLimit - existingUserTicketCount;

  return {
    error: true,
    message: remainingUserTicketLimit
      ? `By reserving these tickets you'll reach the user ticket limit of ${perUserTicketLimit}. Please try again using your remaininig ticket limit of ${remainingUserTicketLimit}.`
      : "You've reached the maximum number of tickets that you can purchase today.",
  };
};

export const createTickets = async ({
  lot,
  uid,
  ticketCount,
  dependencies = {
    firebaseFetchTickets,
    firebaseWriteBatch,
  },
}: {
  lot: Lot;
  uid: UserId;
  ticketCount: number;
  dependencies?: {
    firebaseFetchTickets: typeof firebaseFetchTickets;
    firebaseWriteBatch: typeof firebaseWriteBatch;
  };
}): Promise<FirebaseFunctionResponse<TicketId[]>> => {
  // validate against ticketsAvailable
  if (ticketCount > lot.ticketsAvailable) {
    return getNotEnoughTicketsAvailableResponse({
      ticketCount,
      ticketsAvailable: lot.ticketsAvailable,
    });
  }

  // validate against perUserTicketLimit
  const existingUserTicketCount = (
    await dependencies.firebaseFetchTickets({ lotId: lot.id, uid })
  ).length;
  const remainingUserTicketLimit =
    lot.perUserTicketLimit - existingUserTicketCount;

  if (ticketCount > remainingUserTicketLimit) {
    return getReachedUserTicketLimitResponse({
      existingUserTicketCount,
      perUserTicketLimit: lot.perUserTicketLimit,
    });
  }

  const ticketDocs = arrayFromNumber(ticketCount).map(() => {
    const id = getUuid();
    const ticket = makeTicket({
      id,
      uid,
      price: lot.ticketPriceInBTC,
    });

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

  await dependencies.firebaseWriteBatch(ticketDocs);

  const ticketIds = ticketDocs.map((ticket) => ticket.data.id);

  return {
    error: false,
    message: 'Great success!',
    data: ticketIds,
  };
};
