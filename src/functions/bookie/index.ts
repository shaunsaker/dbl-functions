import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { LotId, Ticket, TicketStatus, UserId } from '../../models';
import { createInvoice } from '../../services/btcPayServer/createInvoice';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoicePayload,
} from '../../services/btcPayServer/models';
import { firebase } from '../../services/firebase';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseGetUser } from '../../services/firebase/firebaseGetUser';
import { firebaseWriteBatch } from '../../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { arrayFromNumber } from '../../utils/arrayFromNumber';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { getUuid } from '../../utils/getUuid';

const makeInvoicePayload = ({
  amount,
  lotId,
  uid,
}: {
  amount: number;
  lotId: LotId;
  uid: UserId;
}): BtcPayServerInvoicePayload => {
  return {
    amount: amount || 0,
    checkout: {
      speedPolicy: 'LowSpeed',
    },
    metadata: {
      lotId,
      uid,
    },
  };
};

type Response = FirebaseFunctionResponse<BtcPayServerInvoice>;

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
  const lot = await firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Could not find this lot.',
      data: undefined,
    };
  }

  // validate the lotId
  if (lotId !== lot.id) {
    return {
      error: true,
      message: 'lotId is invalid.',
      data: undefined,
    };
  }

  // validate against ticketsAvailable
  if (ticketCount > lot.ticketsAvailable) {
    return {
      error: true,
      message: `There are only ${lot.ticketsAvailable} and you are attempting to reserve ${ticketCount} tickets. Please try again with ${lot.ticketsAvailable} tickets.`,
      data: undefined,
    };
  }

  // validate against perUserTicketLimit
  if (ticketCount > lot.perUserTicketLimit) {
    return {
      error: true,
      message: `You've reached the ticket limit of ${lot.perUserTicketLimit}.`,
      data: undefined,
    };
  }

  // create the tickets
  const docs = arrayFromNumber(ticketCount).map(() => {
    const id = getUuid();
    const ticket: Ticket = {
      id,
      uid,
      price: lot.ticketPriceInBTC,
      status: TicketStatus.reserved,
      reservedTime: getTimeAsISOString(),
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

  const ticketValueBTC = ticketCount * lot.ticketPriceInBTC;
  const invoicePayload = makeInvoicePayload({
    amount: ticketValueBTC,
    lotId: lot.id,
    uid,
  });
  const invoice = await createInvoice(lot.storeId, invoicePayload);

  return {
    error: false,
    message: 'Success',
    data: invoice,
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
