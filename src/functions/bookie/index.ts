import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { LotId, Ticket, TicketStatus } from '../../models';
import { createBlockchainAddress } from '../../services/blockCypher/createBlockchainAddress';
import { firebase } from '../../services/firebase';
import { firebaseFetchActiveLot } from '../../services/firebase/firebaseFetchActiveLot';
import { firebaseGetUser } from '../../services/firebase/firebaseGetUser';
import { firebaseSaveUserLotAddress } from '../../services/firebase/firebaseSaveUserLotAddress';
import { firebaseWriteBatch } from '../../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { arrayFromNumber } from '../../utils/arrayFromNumber';
import { encrypt } from '../../utils/crypto';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { getUuid } from '../../utils/getUuid';

type Response = FirebaseFunctionResponse<void>;

export const runBookie = async ({
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

  // validate against ticketsAvailable
  if (ticketCount > activeLot.ticketsAvailable) {
    return {
      error: true,
      message: `There are only ${activeLot.ticketsAvailable} and you are attempting to reserve ${ticketCount} tickets. Please try again with ${activeLot.ticketsAvailable} tickets.`,
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

  // create an address for this user
  const addressKeychain = await createBlockchainAddress();

  // save the private key as a hash using the secret
  // (we need to be able to move funds from this address later)
  const hash = encrypt(
    addressKeychain.private,
    process.env.USERS_ADDRESS_SECRET,
  );

  await firebaseSaveUserLotAddress({
    lotId,
    uid,
    data: {
      address: addressKeychain.address, // extra data and not really necessary
      hash,
    },
  });

  // iterate over the ticketCount and create individual tickets
  const docs = arrayFromNumber(ticketCount).map(() => {
    const id = getUuid();
    const ticket: Ticket = {
      id,
      uid,
      status: TicketStatus.reserved,
      reservedTime: getTimeAsISOString(),
      address: addressKeychain.address,
    };

    return {
      ref: firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('tickets')
        .doc(id),
      data: ticket,
    };
  });

  await firebaseWriteBatch(docs);

  return {
    error: false,
    message: 'Success',
    data: undefined,
  };
};

const bookie = functions.https.onCall(
  async (
    data: {
      lotId: LotId;
      ticketCount: number;
    },
    context: CallableContext,
  ): Promise<Response> => {
    const uid = context.auth?.uid;
    const { lotId, ticketCount } = data;

    return await runBookie({
      uid,
      lotId,
      ticketCount,
    });
  },
);

export { bookie };
