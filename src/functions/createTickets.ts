import { InvoiceId } from '../store/invoices/models';
import { Lot } from '../store/lots/models';
import { firebase } from '../services/firebase';
import { firebaseFetchTickets } from '../services/firebase/firebaseFetchTickets';
import { firebaseWriteBatch } from '../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../services/firebase/models';
import { TicketId, Ticket } from '../store/tickets/models';
import { UserId } from '../store/userProfile/models';
import { arrayFromNumber } from '../utils/arrayFromNumber';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { blockCypherGetBlockByHeight } from '../services/blockCypher/blockCypherGetBlockByHeight';
import { firebaseUpdateLot } from '../services/firebase/firebaseUpdateLot';

export const getNotEnoughTicketsAvailableResponseMessage = ({
  ticketCount,
  totalAvailableTickets,
}: {
  ticketCount: number;
  totalAvailableTickets: number;
}) =>
  totalAvailableTickets === 0
    ? 'There are no more tickets available for this lot. Please try again tomorrow.'
    : `There are only ${totalAvailableTickets} and you are attempting to reserve ${ticketCount} tickets. please try again with ${totalAvailableTickets} tickets.`;

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
  ticketPriceBTC,
  invoiceId,
  dependencies = {
    firebaseFetchTickets,
    blockCypherGetBlockByHeight,
    firebaseUpdateLot,
    firebaseWriteBatch,
  },
}: {
  lot: Lot;
  uid: UserId;
  ticketCount: number;
  ticketPriceBTC: number;
  invoiceId: InvoiceId;
  dependencies?: {
    firebaseFetchTickets: typeof firebaseFetchTickets;
    blockCypherGetBlockByHeight: typeof blockCypherGetBlockByHeight;
    firebaseUpdateLot: typeof firebaseUpdateLot;
    firebaseWriteBatch: typeof firebaseWriteBatch;
  };
}): Promise<FirebaseFunctionResponse<TicketId[]>> => {
  // validate against totalAvailableTickets
  if (ticketCount > lot.totalAvailableTickets) {
    const message = getNotEnoughTicketsAvailableResponseMessage({
      ticketCount,
      totalAvailableTickets: lot.totalAvailableTickets,
    });

    console.log(`createTickets: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // validate against perUserTicketLimit
  const lotId = lot.id;
  const existingUserTicketCount = (
    await dependencies.firebaseFetchTickets({ lotId, uid })
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

  // get the n -1 block hash as the ticket id for each ticket
  let latestTicketIdBlockHeight = lot.latestTicketIdBlockHeight;
  const tickets: Ticket[] = [];

  // we iterate in an ordered loop to make sure that the latestTicketIdBlockHeight is updated correctly
  for await (const _ of arrayFromNumber(ticketCount)) {
    // get the previous block hash using the latestTicketIdBlockHeight
    const previousBlockHeight = latestTicketIdBlockHeight - 1;
    const previousBlockHash = (
      await dependencies.blockCypherGetBlockByHeight(previousBlockHeight)
    ).hash;

    const ticket: Ticket = {
      id: previousBlockHash,
      lotId,
      uid,
      priceBTC: ticketPriceBTC,
      dateCreated: getTimeAsISOString(),
      invoiceId,
    };

    tickets.push(ticket);
    latestTicketIdBlockHeight = previousBlockHeight;
  }

  const ticketDocs = tickets.map((ticket) => ({
    ref: firebase
      .firestore()
      .collection('lots')
      .doc(lotId)
      .collection('tickets')
      .doc(ticket.id),
    data: ticket,
  }));

  await dependencies.firebaseWriteBatch(ticketDocs);

  // save the latestTicketIdBlockHeight to the lot
  await dependencies.firebaseUpdateLot(lotId, { latestTicketIdBlockHeight });

  return {
    error: false,
    message: 'great success!',
    data: tickets.map((ticket) => ticket.id),
  };
};
