import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { LotId, Ticket, TicketStatus } from '../../models';
import { firebaseCreateTicket } from '../../services/firebase/firebaseCreateTicket';
import { firebaseFetchActiveLot } from '../../services/firebase/firebaseFetchActiveLot';
import { firebaseGetUser } from '../../services/firebase/firebaseGetUser';
import { FirebaseCallableFunctionsResponse } from '../../services/firebase/models';
import { arrayFromNumber } from '../../utils/arrayFromNumber';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';

type Response = FirebaseCallableFunctionsResponse<void>;

export const reserveTicketsForUid = async ({
  uid,
  lotId,
  ticketCount,
}: {
  uid: string | undefined;
  lotId: LotId;
  ticketCount: number;
}): Promise<Response> => {
  if (!uid) {
    return {
      error: true,
      message: 'User is not signed in',
      data: undefined,
    };
  }

  // check that the user exists
  try {
    await firebaseGetUser(uid);
  } catch (error) {
    return {
      error: true,
      message: (error as Error).message,
      data: undefined,
    };
  }

  if (!lotId) {
    return {
      error: true,
      message: 'Please provide a lotId',
      data: undefined,
    };
  }

  if (!ticketCount) {
    return {
      error: true,
      message: 'Please provide a ticketCount',
      data: undefined,
    };
  }

  // fetch the active lot
  const activeLot = await firebaseFetchActiveLot();

  if (!activeLot) {
    return {
      error: true,
      message: 'No lot is currently active.',
      data: undefined,
    };
  }

  // validate the lotId
  if (lotId !== activeLot.id) {
    return {
      error: true,
      message: 'lotId is invalid.',
      data: undefined,
    };
  }

  // validate against ticketsLeft
  if (ticketCount > activeLot.ticketsLeft) {
    return {
      error: true,
      message: `There are only ${activeLot.ticketsLeft} and you are attempting to reserve ${ticketCount} tickets. Please try again with ${activeLot.ticketsLeft} tickets.`,
      data: undefined,
    };
  }

  // validate against perUserTicketLimit
  if (ticketCount > activeLot.perUserTicketLimit) {
    return {
      error: true,
      message: `You've reached the ticket limit of ${activeLot.perUserTicketLimit}.`,
      data: undefined,
    };
  }

  // iterate over the ticketCount and create individual tickets
  // FIXME: we could optimise this by using Firebase batches if there are a lot of tickets
  for (const _ of arrayFromNumber(ticketCount)) {
    const ticket: Omit<Ticket, 'id'> = {
      uid,
      status: TicketStatus.pendingDeposit,
      reservedTime: getTimeAsISOString(),
    };

    await firebaseCreateTicket(lotId, ticket);
  }

  return {
    error: false,
    message: 'Success',
    data: undefined,
  };
};

const reserveTickets = functions.https.onCall(
  async (
    data: { lotId: LotId; ticketCount: number },
    context: CallableContext,
  ): Promise<Response> => {
    const uid = context.auth?.uid;
    const { lotId, ticketCount } = data;

    const response = await reserveTicketsForUid({ uid, lotId, ticketCount });

    return response;
  },
);

export { reserveTickets };
