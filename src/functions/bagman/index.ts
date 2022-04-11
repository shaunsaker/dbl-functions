import * as functions from 'firebase-functions';
import { LotId, Ticket, TicketStatus } from '../../models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import { BtcPayServerInvoiceReceivedPaymentEventData } from '../../services/btcPayServer/models';
import { firebase } from '../../services/firebase';
import { firebaseFetchReservedLotTickets } from '../../services/firebase/firebaseFetchReservedLotTickets';
import { firebaseWriteBatch } from '../../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../utils/verifySignature';

const getConfirmedTickets = (amount: number, tickets: Ticket[]): Ticket[] => {
  let amountRemaining = amount;
  const confirmedTickets: Ticket[] = [];

  tickets.forEach((ticket) => {
    if (amountRemaining > ticket.price) {
      // remove the ticket price from the amount remaining
      amountRemaining -= ticket.price;

      // make the ticket status confirmed
      const newTicket: Ticket = {
        ...ticket,
        status: TicketStatus.confirmed,
      };

      confirmedTickets.push(newTicket);
    }
  });

  return confirmedTickets;
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

type Response = FirebaseFunctionResponse<void>;

export const runBagman = async (
  data: BtcPayServerInvoiceReceivedPaymentEventData,
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

  // fetch the tickets
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

  const tickets = await firebaseFetchReservedLotTickets({ lotId, uid });

  if (!tickets.length) {
    return {
      error: true,
      message: 'Free money baby!',
      data: undefined,
    };
  }

  // it could be a partial payment so
  // using the value of the payment, mark X tickets as paid
  const { amount } = invoice;
  const confirmedTickets: Ticket[] = getConfirmedTickets(
    parseFloat(amount),
    tickets,
  );

  // write the confirmed tickets to firebase
  await saveTickets(lotId, confirmedTickets);

  return {
    error: false,
    message: 'Great Success!',
    data: undefined,
  };
};

const bagman = functions.https.onRequest(
  async (request, response): Promise<void> => {
    const signature = request.headers['BTCPay-Sig'];

    if (!signature) {
      response.status(401).send(); // unauthorised
    }

    const body = request.body;
    const isValidSignature = verifySignature({
      secret: process.env.WEBHOOK_SECRET,
      body,
      signature: signature as string,
    });

    if (!isValidSignature) {
      response.status(401).send('You fuck on meee!');
    }

    const data: BtcPayServerInvoiceReceivedPaymentEventData = JSON.parse(body);

    const bagmanResponse = await runBagman(data);

    response
      .status(bagmanResponse.error ? 400 : 200)
      .send(bagmanResponse.message);
  },
);

export { bagman };
