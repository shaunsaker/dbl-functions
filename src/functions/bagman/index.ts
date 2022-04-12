import * as functions from 'firebase-functions';
import { Lot, Ticket, TicketStatus } from '../../models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import { BtcPayServerInvoicePaymentEventData } from '../../services/btcPayServer/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseFetchReservedTickets } from '../../services/firebase/firebaseFetchReservedTickets';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { maybePluralise } from '../../utils/maybePluralise';
import { numberToDigits } from '../../utils/numberToDigits';
import { saveTickets } from '../saveTickets';
import { markTicketsStatus } from '../markTicketsStatus';

const updateLotStats = async (lot: Lot, tickets: Ticket[]): Promise<void> => {
  const { totalInBTC, confirmedTicketCount, ticketsAvailable } = lot;
  const confirmedTicketsValue = tickets.reduce(
    (total, next) => (total += next.price),
    0,
  );
  const newTotalInBtc = numberToDigits(totalInBTC + confirmedTicketsValue, 6);
  const newConfirmedTicketCount = confirmedTicketCount + tickets.length;
  const newTicketsAvailable = ticketsAvailable - tickets.length;
  const newLot: Partial<Lot> = {
    totalInBTC: newTotalInBtc,
    confirmedTicketCount: newConfirmedTicketCount,
    ticketsAvailable: newTicketsAvailable,
  };

  await firebaseUpdateLot(lot.id, newLot);
};

type Response = FirebaseFunctionResponse<void>;

export const runBagman = async (
  data: BtcPayServerInvoicePaymentEventData,
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

  // fetch the tickets using the ticketIds in the invoice
  const tickets = await firebaseFetchReservedTickets({
    lotId,
    ticketIds: invoice.metadata.ticketIds,
  });

  if (!tickets.length) {
    return {
      error: true,
      message: 'Free money baby!',
      data: undefined,
    };
  }

  // mark the remaining reserved tickets as confirmed
  const confirmedTickets: Ticket[] = markTicketsStatus(
    tickets,
    TicketStatus.confirmed,
  );

  // write the confirmed tickets to firebase
  await saveTickets(lotId, confirmedTickets);

  // fetch the lot
  const lot = await firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Lot missing fool.',
      data: undefined,
    };
  }

  // update the lot stats
  await updateLotStats(lot, confirmedTickets);

  return {
    error: false,
    message: `Great Success!  ${maybePluralise(
      confirmedTickets.length,
      'ticket',
    )} were marked as confirmed.`,
    data: undefined,
  };
};

const bagman = functions.https.onRequest(
  async (request, response): Promise<void> => {
    const signature = request.get('BTCPay-Sig');

    if (!signature) {
      response.status(200).send('You fuck on meee!'); // webhook needs 200 otherwise it will try redeliver continuously

      return;
    }

    const isValidSignature = verifySignature({
      secret: process.env.WEBHOOK_SECRET,
      body: request.body,
      signature,
    });

    if (!isValidSignature) {
      response.status(200).send('You fuck on meee!');

      return;
    }

    const data: BtcPayServerInvoicePaymentEventData = request.body;

    // ignore all other webhook events in case the webhook was not set up correctly
    if (
      data.type !== 'InvoiceSettled' &&
      data.type !== 'InvoicePaymentSettled'
    ) {
      response.status(200).send(`Received ${data.type} event.`);

      return;
    }

    try {
      const bagmanResponse = await runBagman(data);

      response.status(200).send(bagmanResponse.message);
    } catch (error) {
      response.status(200).send((error as Error).message);
    }
  },
);

export { bagman };
