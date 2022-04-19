import { makeTicket } from '../lots/data';
import { Lot, TicketId } from '../lots/models';
import { firebase } from '../services/firebase';
import { firebaseFetchTickets } from '../services/firebase/firebaseFetchTickets';
import { firebaseWriteBatch } from '../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../services/firebase/models';
import { UserId } from '../userProfile/models';
import { arrayFromNumber } from '../utils/arrayFromNumber';
import { getUuid } from '../utils/getUuid';

export const getNotEnoughTicketsAvailableResponseMessage = ({
  ticketCount,
  ticketsAvailable,
}: {
  ticketCount: number;
  ticketsAvailable: number;
}) =>
  ticketsAvailable === 0
    ? 'There are no more tickets available for this lot. Please try again tomorrow.'
    : `There are only ${ticketsAvailable} and you are attempting to reserve ${ticketCount} tickets. please try again with ${ticketsAvailable} tickets.`;

export const getReachedUserTicketLimitResponseMessage = ({
  existingUserTicketCount,
  perUserTicketLimit,
}: {
  existingUserTicketCount: number;
  perUserTicketLimit: number;
}) => {
  const remainingUserTicketLimit = perUserTicketLimit - existingUserTicketCount;

  return remainingUserTicketLimit
    ? `By reserving these tickets you'll reach the user ticket limit of ${perUserTicketLimit}. please try again using your remaininig ticket limit of ${remainingUserTicketLimit}.`
    : "You've reached the maximum number of tickets that you can purchase today.";
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
    const message = getNotEnoughTicketsAvailableResponseMessage({
      ticketCount,
      ticketsAvailable: lot.ticketsAvailable,
    });

    console.log(`createTickets: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // validate against perUserTicketLimit
  const existingUserTicketCount = (
    await dependencies.firebaseFetchTickets({ lotId: lot.id, uid })
  ).length;
  const remainingUserTicketLimit =
    lot.perUserTicketLimit - existingUserTicketCount;

  if (ticketCount > remainingUserTicketLimit) {
    const message = getReachedUserTicketLimitResponseMessage({
      existingUserTicketCount,
      perUserTicketLimit: lot.perUserTicketLimit,
    });

    console.log(`createTickets: ${message}`);

    return {
      error: true,
      message,
    };
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
    message: 'great success!',
    data: ticketIds,
  };
};
