import * as functions from 'firebase-functions';
import { Lot, LotId, Ticket, TicketStatus } from '../../models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import { BtcPayServerInvoiceExpiredEventData } from '../../services/btcPayServer/models';
import { firebaseFetchReservedTickets } from '../../services/firebase/firebaseFetchReservedTickets';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { saveTickets } from '../saveTickets';

const expireTickets = (tickets: Ticket[]): Ticket[] => {
  const expiredTickets: Ticket[] = [];

  tickets.forEach((ticket) => {
    const newTicket: Ticket = {
      ...ticket,
      status: TicketStatus.confirmed,
    };

    expiredTickets.push(newTicket);
  });

  return expiredTickets;
};

const updateLotTicketsAvailable = async (
  lotId: LotId,
  newTicketsAvailable: number,
): Promise<void> => {
  const newLot: Partial<Lot> = {
    ticketsAvailable: newTicketsAvailable,
  };

  await firebaseUpdateLot(lotId, newLot);
};

type Response = FirebaseFunctionResponse<void>;

export const runBusker = async (
  data: BtcPayServerInvoiceExpiredEventData,
): Promise<Response> => {
  // we need to get the lotId and uid from the invoice
  // so we need to fetch the invoice
  const { storeId, invoiceId } = data;

  if (!storeId) {
    return {
      error: true,
      message: 'storeId missing fool.',
      data: undefined,
    };
  }

  if (!invoiceId) {
    return {
      error: true,
      message: 'invoiceId missing fool.',
      data: undefined,
    };
  }

  const invoice = await getInvoice({ storeId, invoiceId });

  if (!invoice) {
    return {
      error: true,
      message: 'Invoice missing fool.',
      data: undefined,
    };
  }

  const { lotId, uid } = invoice.metadata;

  if (!lotId) {
    return {
      error: true,
      message: 'lotId missing from invoice fool.',
      data: undefined,
    };
  }

  if (!uid) {
    return {
      error: true,
      message: 'uid missing from invoice fool.',
      data: undefined,
    };
  }

  // fetch the tickets
  const tickets = await firebaseFetchReservedTickets({ lotId, uid });

  if (!tickets.length) {
    return {
      error: true,
      message: 'Somethings whack, no reserved tickets left 🤔',
      data: undefined,
    };
  }

  // fetch the lot
  const lot = await firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Lot missing fool.',
      data: undefined,
    };
  }

  // it could be a partial payment so
  // using the value of the payment, mark X tickets as paid
  // and save them to firebase
  const expiredTickets: Ticket[] = expireTickets(tickets);

  // write the expired tickets to firebase
  await saveTickets(lotId, expiredTickets);

  // update the lot tickets available
  const newTicketsAvailable = lot.ticketsAvailable + expiredTickets.length;
  await updateLotTicketsAvailable(lot.id, newTicketsAvailable);

  return {
    error: false,
    message: 'Great Success!',
    data: undefined,
  };
};

const busker = functions.https.onRequest(
  async (request, response): Promise<void> => {
    const signature = request.get('BTCPay-Sig');

    if (!signature) {
      response.status(401).send('You fuck on meee!');

      return;
    }

    const isValidSignature = verifySignature({
      secret: process.env.WEBHOOK_SECRET,
      body: request.body,
      signature,
    });

    if (!isValidSignature) {
      response.status(401).send('You fuck on meee!');

      return;
    }

    const data: BtcPayServerInvoiceExpiredEventData = JSON.parse(request.body);

    // ignore all other webhook events in case the webhook was not set up correctly
    if (data.type !== 'InvoiceExpired' && data.type !== 'InvoiceInvalid') {
      response.status(200).send(`Received ${data.type} event.`);

      return;
    }

    try {
      const buskerResponse = await runBusker(data);

      response
        .status(buskerResponse.error ? 400 : 200)
        .send(buskerResponse.message);
    } catch (error) {
      response.status(500).send((error as Error).message);
    }
  },
);

export { busker };
