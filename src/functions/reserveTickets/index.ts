import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { LotId, Ticket, TicketStatus, WalletId } from '../../models';
import { firebaseCreateTicket } from '../../services/firebase/firebaseCreateTicket';
import { firebaseFetchActiveLot } from '../../services/firebase/firebaseFetchActiveLot';
import { firebaseFetchUserProfile } from '../../services/firebase/firebaseFetchUserProfile';
import { firebaseGetUser } from '../../services/firebase/firebaseGetUser';
import { FirebaseCallableFunctionsResponse } from '../../services/firebase/models';
import { arrayFromNumber } from '../../utils/arrayFromNumber';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';

type Response = FirebaseCallableFunctionsResponse<void>;

export const reserveTicketsForUid = async ({
  uid,
  lotId,
  ticketCount,
  userWalletId,
}: {
  uid: string | undefined;
  lotId: LotId;
  ticketCount: number;
  userWalletId: WalletId;
}): Promise<Response> => {
  if (!uid) {
    return {
      error: true,
      message: 'User is not signed in',
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

  if (!userWalletId) {
    return {
      error: true,
      message: 'Please provide a userWalletId',
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

  const userProfileData = await firebaseFetchUserProfile(uid);
  const wallet = userProfileData.wallets[userWalletId];

  if (!wallet) {
    return {
      error: true,
      message: 'Could not find this wallet',
      data: undefined,
    };
  }

  // iterate over the ticketCount and create individual tickets
  // FIXME: we could optimise this by using Firebase batches if there are a lot of tickets
  const createTicketPromises = arrayFromNumber(ticketCount).map(() => {
    const ticket: Omit<Ticket, 'id'> = {
      uid,
      status: TicketStatus.pendingDeposit,
      walletAddress: wallet.address,
      reservedTime: getTimeAsISOString(),
    };

    return firebaseCreateTicket(lotId, ticket);
  });

  await Promise.all(createTicketPromises);

  return {
    error: false,
    message: 'Success',
    data: undefined,
  };
};

const reserveTickets = functions.https.onCall(
  async (
    data: {
      lotId: LotId;
      ticketCount: number;
      userWalletId: WalletId;
    },
    context: CallableContext,
  ): Promise<Response> => {
    const uid = context.auth?.uid;
    const { lotId, ticketCount, userWalletId } = data;

    const response = await reserveTicketsForUid({
      uid,
      lotId,
      ticketCount,
      userWalletId,
    });

    return response;
  },
);

export { reserveTickets };
