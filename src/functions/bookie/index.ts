import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { Lot, LotId, TicketId, TicketStatus, UserId } from '../../models';
import { createInvoice } from '../../services/btcPayServer/createInvoice';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoicePayload,
} from '../../services/btcPayServer/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseGetUser } from '../../services/firebase/firebaseGetUser';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
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

const updateLotTicketsAvailable = async (
  lotId: LotId,
  newTicketsAvailable: number,
): Promise<Response> => {
  const newLot: Partial<Lot> = {
    ticketsAvailable: newTicketsAvailable,
  };

  await firebaseUpdateLot(lotId, newLot);

  return {
    error: false,
    message: 'Great Success!',
    data: undefined,
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

  // fetch the lot
  const lot = await firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Could not find this lot.',
      data: undefined,
    };
  }

  // create the tickets
  const createTicketsResponse = await createTickets({
    lot,
    uid,
    ticketCount,
    ticketPriceInBTC: lot.ticketPriceInBTC,
    ticketStatus: TicketStatus.awaitingPayment,
  });

  if (createTicketsResponse.error) {
    return {
      error: true,
      message: createTicketsResponse.message,
      data: undefined,
    };
  }

  if (!createTicketsResponse.data) {
    return {
      error: true,
      message: 'No ticketIds 🤔',
      data: undefined,
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

  // update the lot tickets available
  // TODO: SS this will be a new function based on ticket changes
  const newTicketsAvailable = lot.ticketsAvailable - ticketCount;
  await updateLotTicketsAvailable(lot.id, newTicketsAvailable);

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
