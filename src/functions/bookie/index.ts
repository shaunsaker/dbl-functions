import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { LotId, TicketId } from '../../lots/models';
import { createInvoice } from '../../services/btcPayServer/createInvoice';
import { makeBtcPayServerInvoicePayload } from '../../services/btcPayServer/data';
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
    const message = `user is not signed in.`;

    console.log(`bookie: ${message}.`);

    return {
      error: true,
      message,
    };
  }

  if (!lotId) {
    const message = `please provide a lotId.`;

    console.log(`bookie: ${message}`);

    return {
      error: true,
      message,
    };
  }

  if (!ticketCount) {
    const message = `please provide a ticket count > 0.`;

    console.log(`bookie: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // check that the user exists
  try {
    await dependencies.firebaseGetUser(uid);
  } catch (error) {
    const message = `user does not exist.`;

    console.log(`bookie: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // fetch the lot
  const lot = await dependencies.firebaseFetchLot(lotId);

  if (!lot) {
    const message = `could not find this lot.`;

    console.log(`bookie: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // get the store
  const store = await dependencies.getStoreByStoreName(lotId);

  if (!store) {
    const message = `could not find this store.`;

    console.log(`bookie: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // create the tickets
  const createTicketsResponse = await dependencies.createTickets({
    lot,
    uid,
    ticketCount,
  });

  if (createTicketsResponse.error) {
    const message = createTicketsResponse.message;

    console.log(`bookie: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // create the invoice
  const invoice = await dependencies.createInvoice(
    store.id,
    makeBtcPayServerInvoicePayload({
      amount: ticketCount * lot.ticketPriceInBTC * lot.BTCPriceInUSD,
      uid,
      lotId: lot.id,
      ticketIds: createTicketsResponse.data as TicketId[], // these are definitely defined
    }),
  );

  return {
    error: false,
    message: 'great success!',
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
