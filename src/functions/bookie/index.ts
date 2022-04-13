import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { LotId, TicketId, TicketStatus, UserId } from '../../models';
import { createInvoice } from '../../services/btcPayServer/createInvoice';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoicePayload,
} from '../../services/btcPayServer/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseGetUser } from '../../services/firebase/firebaseGetUser';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { createTickets } from '../createTickets';

const makeInvoicePayload = ({
  amount,
  uid,
  lotId,
  ticketIds,
}: {
  amount: number;
  uid: UserId;
  lotId: LotId;
  ticketIds: TicketId[];
}): BtcPayServerInvoicePayload => {
  return {
    amount: amount || 0,
    checkout: {
      speedPolicy: 'LowSpeed',
    },
    metadata: {
      uid,
      lotId,
      ticketIds,
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
    };
  }

  if (!lotId) {
    return {
      error: true,
      message: 'Please provide a lotId',
    };
  }

  if (!ticketCount) {
    return {
      error: true,
      message: 'Please provide a ticketCount',
    };
  }

  // check that the user exists
  try {
    await firebaseGetUser(uid);
  } catch (error) {
    return {
      error: true,
      message: (error as Error).message,
    };
  }

  // fetch the lot
  const lot = await firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Could not find this lot.',
    };
  }

  // create the tickets
  const createTicketsResponse = await createTickets({
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

  if (!createTicketsResponse.data) {
    return {
      error: true,
      message: 'No ticketIds 🤔',
    };
  }

  // create the invoice
  const ticketValueBTC = ticketCount * lot.ticketPriceInBTC;
  const ticketValueUSD = ticketValueBTC * lot.BTCPriceInUSD;
  const invoicePayload = makeInvoicePayload({
    amount: ticketValueUSD,
    uid,
    lotId: lot.id,
    ticketIds: createTicketsResponse.data,
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
