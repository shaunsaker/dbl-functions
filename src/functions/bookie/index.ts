import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { LotId, TicketId, TicketStatus } from '../../lots/models';
import { createInvoice } from '../../services/btcPayServer/createInvoice';
import { makeInvoicePayload } from '../../services/btcPayServer/data';
import { getStoreByStoreName } from '../../services/btcPayServer/getStoreByStoreName';
import { BtcPayServerInvoice } from '../../services/btcPayServer/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseGetUser } from '../../services/firebase/firebaseGetUser';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { createTickets } from '../createTickets';

type Response = FirebaseFunctionResponse<BtcPayServerInvoice>;

export const runBookie = async ({
  uid,
  lotId,
  ticketCount,
  dependencies = {
    firebaseGetUser,
    firebaseFetchLot,
    getStoreByStoreName,
    createTickets,
    createInvoice,
  },
}: {
  uid: string | undefined;
  lotId: LotId;
  ticketCount: number;
  dependencies?: {
    firebaseGetUser: typeof firebaseGetUser;
    firebaseFetchLot: typeof firebaseFetchLot;
    getStoreByStoreName: typeof getStoreByStoreName;
    createTickets: typeof createTickets;
    createInvoice: typeof createInvoice;
  };
}): Promise<Response> => {
  if (!uid) {
    return {
      error: true,
      message: 'User is not signed in.',
    };
  }

  if (!lotId) {
    return {
      error: true,
      message: 'Please provide a lotId.',
    };
  }

  if (!ticketCount) {
    return {
      error: true,
      message: 'Please provide a ticketCount greater than 0.',
    };
  }

  // check that the user exists
  try {
    await dependencies.firebaseGetUser(uid);
  } catch (error) {
    return {
      error: true,
      message: 'User does not exist.',
    };
  }

  // fetch the lot
  const lot = await dependencies.firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Could not find this lot.',
    };
  }

  // get the store
  const store = await dependencies.getStoreByStoreName(lotId);

  if (!store) {
    return {
      error: true,
      message: 'Could not find this store.',
    };
  }

  // create the tickets
  const createTicketsResponse = await dependencies.createTickets({
    lot,
    uid,
    ticketCount,
    ticketPriceInBTC: lot.ticketPriceInBTC,
    ticketStatus: TicketStatus.reserved,
  });

  if (createTicketsResponse.error) {
    return {
      error: true,
      message: createTicketsResponse.message,
    };
  }

  // create the invoice
  const invoice = await dependencies.createInvoice(
    store.id,
    makeInvoicePayload({
      amount: ticketCount * lot.ticketPriceInBTC * lot.BTCPriceInUSD,
      uid,
      lotId: lot.id,
      ticketIds: createTicketsResponse.data as TicketId[], // these are definitely defined
    }),
  );

  return {
    error: false,
    message: 'Great success!',
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
