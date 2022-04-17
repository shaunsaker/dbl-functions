import * as functions from 'firebase-functions';
import { Ticket, TicketStatus } from '../../lots/models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import {
  BtcPayServerInvoiceReceivedPaymentEventData,
  BtcPayServerWebhookEvent,
} from '../../services/btcPayServer/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseFetchTickets } from '../../services/firebase/firebaseFetchTickets';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { maybePluralise } from '../../utils/maybePluralise';
import { saveTickets } from '../saveTickets';
import { markTicketsStatus } from '../markTicketsStatus';
import { createTickets } from '../createTickets';
import { updateInvoice } from '../../services/btcPayServer/updateInvoice';

export type BagmanResponse = FirebaseFunctionResponse<void>;

// bagman is a webhook for the InvoiceReceivedPaymentEvent
// he'll mark an invoices ticket statuses as Payment Received
// he also handles partial payments and over payments
export const runBagman = async (
  data: BtcPayServerInvoiceReceivedPaymentEventData,
  dependencies: {
    getInvoice: typeof getInvoice;
    firebaseFetchLot: typeof firebaseFetchLot;
    firebaseFetchTickets: typeof firebaseFetchTickets;
    markTicketsStatus: typeof markTicketsStatus;
    saveTickets: typeof saveTickets;
    createTickets: typeof createTickets;
    updateInvoice: typeof updateInvoice;
  } = {
    getInvoice,
    firebaseFetchLot,
    firebaseFetchTickets,
    markTicketsStatus,
    saveTickets,
    createTickets,
    updateInvoice,
  },
): Promise<BagmanResponse> => {
  // we need to get the lotId and uid from the invoice
  // so we need to fetch the invoice
  const { storeId, invoiceId } = data;

  if (!storeId) {
    return {
      error: true,
      message: 'storeId missing fool.',
    };
  }

  if (!invoiceId) {
    return {
      error: true,
      message: 'invoiceId missing fool.',
    };
  }

  const invoice = await dependencies.getInvoice({
    storeId,
    invoiceId,
  });

  if (!invoice) {
    return {
      error: true,
      message: 'Invoice missing fool.',
    };
  }

  const { lotId, uid, ticketIds } = invoice.metadata;

  if (!lotId) {
    return {
      error: true,
      message: 'lotId missing from invoice fool.',
    };
  }

  if (!uid) {
    return {
      error: true,
      message: 'uid missing from invoice fool.',
    };
  }

  if (!ticketIds) {
    return {
      error: true,
      message: 'ticketIds missing from invoice fool.',
    };
  }

  if (!ticketIds.length) {
    return {
      error: true,
      message: 'ticketIds in invoice are empty fool.',
    };
  }

  // fetch the lot
  const lot = await dependencies.firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Lot missing fool.',
    };
  }

  // fetch the tickets using the ticketIds in the invoice
  const reservedTickets = await dependencies.firebaseFetchTickets({
    lotId,
    uid,
    ticketIds: invoice.metadata.ticketIds,
    ticketStatuses: [TicketStatus.reserved],
  });

  if (!reservedTickets.length) {
    return {
      error: true,
      message: 'Tickets missing fool.',
    };
  }

  const paymentAmountUSD = parseFloat(data.payment.value);
  const paymentAmountBTC = paymentAmountUSD / lot.BTCPriceInUSD;
  const ticketPriceInBTC = lot.ticketPriceInBTC;

  // handle partial payments by only reserving the tickets to the value of the payment
  // e.g. if I reserved 5 tickets but only paid for 3, only reserve 3
  // NOTE: keep in mind that this could also be an over payment

  // the user can afford X amount of tickets
  const quantityTicketsReservable = Math.floor(
    paymentAmountBTC / ticketPriceInBTC,
  );

  // the user has overpaid if they can afford more tickets than they reserved
  const hasUserOverpaidOrPaidLate =
    quantityTicketsReservable > reservedTickets.length;

  // for partial payments, we should only mark a certain amounts of the tickets as paid
  const reservableTickets = hasUserOverpaidOrPaidLate
    ? reservedTickets
    : reservedTickets.slice(0, quantityTicketsReservable - 1);

  // mark the ticket's statuses
  const paidTickets: Ticket[] = dependencies.markTicketsStatus(
    reservableTickets,
    TicketStatus.paymentReceived,
  );

  // update the tickets in firebase
  await dependencies.saveTickets(lotId, paidTickets);

  // TODO: SS handle late payment

  // TODO: SS handle late settlement

  return {
    error: false,
    message: `Great Success!  ${maybePluralise(
      paidTickets.length,
      'ticket',
    )} were marked as reserved.`,
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

    const data: BtcPayServerInvoiceReceivedPaymentEventData = request.body;

    // ignore all other webhook events in case the webhook was not set up correctly
    if (data.type !== BtcPayServerWebhookEvent.invoiceReceivedPayment) {
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
