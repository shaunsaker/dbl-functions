import * as functions from 'firebase-functions';
import { Lot, LotId, Ticket, TicketStatus } from '../../models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import { BtcPayServerInvoicePaymentEventData } from '../../services/btcPayServer/models';
import { firebase } from '../../services/firebase';
import { firebaseFetchReservedTickets } from '../../services/firebase/firebaseFetchReservedTickets';
import { firebaseWriteBatch } from '../../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';

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

const saveTickets = async (lotId: LotId, tickets: Ticket[]): Promise<void> => {
  const docs = tickets.map((ticket) => ({
    ref: firebase
      .firestore()
      .collection('lots')
      .doc(lotId)
      .collection('tickets')
      .doc(ticket.id),
    data: ticket,
  }));

  await firebaseWriteBatch(docs);
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

type Response = FirebaseFunctionResponse<void>;

export const runBusker = async (
  data: BtcPayServerInvoicePaymentEventData,
): Promise<Response> => {
  // we need to get the lotId and uid from the invoice
  // so we need to fetch the invoice
  const { storeId, invoiceId } = data;
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

  // it could be a partial payment so
  // using the value of the payment, mark X tickets as paid
  // and save them to firebase
  const expiredTickets: Ticket[] = expireTickets(tickets);

  // write the expired tickets to firebase
  await saveTickets(lotId, expiredTickets);

  // update the lot tickets available
  const lot = await firebaseFetchLot(lotId);

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
      response.status(401).send(); // unauthorised
    }

    const isValidSignature = verifySignature({
      secret: process.env.WEBHOOK_SECRET,
      body: request.body,
      signature: signature as string,
    });

    if (!isValidSignature) {
      response.status(401).send('You fuck on meee!');
    }

    const data: BtcPayServerInvoicePaymentEventData = JSON.parse(request.body);

    // ignore all other webhook events in case the webhook was not set up correctly
    if (data.type !== 'InvoiceExpired') {
      return;
    }

    const buskerResponse = await runBusker(data);

    response
      .status(buskerResponse.error ? 400 : 200)
      .send(buskerResponse.message);
  },
);

export { busker };
