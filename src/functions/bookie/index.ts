import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { Invoice, InvoiceId } from '../../invoices/models';
import {
  LotId,
  MAX_BTC_DIGITS,
  TARGET_TICKET_VALUE_USD,
  TicketId,
} from '../../lots/models';
import { createInvoice } from '../../services/btcPayServer/createInvoice';
import { makeBtcPayServerInvoicePayload } from '../../services/btcPayServer/data';
import { getInvoicePaymentMethods } from '../../services/btcPayServer/getInvoicePaymentMethods';
import { getStoreByStoreName } from '../../services/btcPayServer/getStoreByStoreName';
import { updateInvoice } from '../../services/btcPayServer/updateInvoice';
import { firebaseCreateInvoice } from '../../services/firebase/firebaseCreateInvoice';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseGetUser } from '../../services/firebase/firebaseGetUser';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { numberToDigits } from '../../utils/numberToDigits';
import { createTickets } from '../createTickets';

type Response = FirebaseFunctionResponse<InvoiceId>;

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
    getInvoicePaymentMethods,
    updateInvoice,
    firebaseCreateInvoice,
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
    getInvoicePaymentMethods: typeof getInvoicePaymentMethods;
    updateInvoice: typeof updateInvoice;
    firebaseCreateInvoice: typeof firebaseCreateInvoice;
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

  const ticketPriceUSD = TARGET_TICKET_VALUE_USD;

  // create the invoice
  // NOTE: we do this before creating the tickets so that we can attach invoice data to the tickets
  // that way, we don't have to fetch invoices on the client
  const invoicePaymentTotalUSD = numberToDigits(ticketCount * ticketPriceUSD);
  const invoice = await dependencies.createInvoice(
    store.id,
    makeBtcPayServerInvoicePayload({
      amount: invoicePaymentTotalUSD,
      uid,
      lotId: lot.id,
      ticketIds: [], // we don't know this yet, we'll update it after the step below
    }),
  );
  const invoiceId = invoice.id;

  // get the invoice payment address
  const paymentMethods = await dependencies.getInvoicePaymentMethods({
    storeId: store.id,
    invoiceId,
  });
  const defaultPaymentMethod = paymentMethods[0];
  const invoicePaymentAddress = defaultPaymentMethod.destination;
  const invoicePaymentAmountBTC = parseFloat(defaultPaymentMethod.amount);
  const invoicePaymentRate = parseFloat(defaultPaymentMethod.rate);

  // use the invoice as the source of truth, ie. ticketPriceBTC should correspond exactly to invoicePaymentAmountBTC
  const ticketPriceBTC = numberToDigits(
    invoicePaymentAmountBTC / ticketCount,
    MAX_BTC_DIGITS,
  );

  // get the invoice payment expiry
  const invoicePaymentExpiry = getTimeAsISOString(
    invoice.expirationTime * 1000,
  );

  // create the tickets
  const createTicketsResponse = await dependencies.createTickets({
    lot,
    uid,
    ticketCount,
    ticketPriceBTC,
    invoiceId,
  });

  if (createTicketsResponse.error) {
    const message = createTicketsResponse.message;

    console.log(`bookie: ${message}`);

    return {
      error: true,
      message,
    };
  }

  const ticketIds = createTicketsResponse.data as TicketId[]; // these are definitely defined

  // update the original invoice with the created ticket ids
  // and payment info (the invoice doesn't keep the BTC value attached)
  await dependencies.updateInvoice(store.id, invoiceId, {
    metadata: {
      ...invoice.metadata,
      ticketIds,
    },
  });

  // create the client invoice
  const clientInvoice: Invoice = {
    id: invoiceId,
    lotId,
    uid,
    address: invoicePaymentAddress,
    amountBTC: invoicePaymentAmountBTC,
    rate: invoicePaymentRate,
    expiry: invoicePaymentExpiry,
    ticketIds,
  };

  await dependencies.firebaseCreateInvoice(lotId, clientInvoice);

  return {
    error: false,
    message: 'great success!',
    data: invoiceId,
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
