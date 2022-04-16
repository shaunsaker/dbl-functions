import * as functions from 'firebase-functions';
import { Ticket, TicketStatus } from '../../lots/models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import {
  BtcPayServerInvoiceSettledEventData,
  BtcPayServerWebhookEvent,
} from '../../services/btcPayServer/models';
import { firebaseFetchTickets } from '../../services/firebase/firebaseFetchTickets';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { maybePluralise } from '../../utils/maybePluralise';
import { saveTickets } from '../saveTickets';
import { markTicketsStatus } from '../markTicketsStatus';

type Response = FirebaseFunctionResponse<void>;

export const runBanker = async (
  data: BtcPayServerInvoiceSettledEventData,
): Promise<Response> => {
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

  const invoice = await getInvoice({ storeId, invoiceId });

  if (!invoice) {
    return {
      error: true,
      message: 'Invoice missing fool.',
    };
  }

  const { lotId, uid } = invoice.metadata;

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

  // fetch the tickets using the ticketIds in the invoice
  const paymentReceivedTickets = await firebaseFetchTickets({
    lotId,
    uid,
    ticketIds: invoice.metadata.ticketIds,
    ticketStatuses: [TicketStatus.paymentReceived],
  });

  if (!paymentReceivedTickets.length) {
    // should not be possible
    return {
      error: true,
      message: 'Free money baby!',
    };
  }

  // mark the remaining tickets as confirmed
  // NOTE: we mark all tickets as confirmed because it's not possible to get the InvoiceSettled
  // event for partial payments
  // NOTE: it should also not be possible to get an over payment at this stage
  // that will be handled in the InvoiceReceivedPayment webhook
  const confirmedTickets: Ticket[] = markTicketsStatus(
    paymentReceivedTickets,
    TicketStatus.confirmed,
  );

  // write the confirmed tickets to firebase
  await saveTickets(lotId, confirmedTickets);

  return {
    error: false,
    message: `Great Success!  ${maybePluralise(
      confirmedTickets.length,
      'ticket',
    )} were marked as confirmed.`,
  };
};

const banker = functions.https.onRequest(
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

    const data: BtcPayServerInvoiceSettledEventData = request.body;

    // ignore all other webhook events in case the webhook was not set up correctly
    if (
      data.type !== BtcPayServerWebhookEvent.invoiceSettled &&
      data.type !== BtcPayServerWebhookEvent.invoicePaymentSettled
    ) {
      response.status(200).send(`Received ${data.type} event.`);

      return;
    }

    try {
      const bankerResponse = await runBanker(data);

      response.status(200).send(bankerResponse.message);
    } catch (error) {
      response.status(200).send((error as Error).message);
    }
  },
);

export { banker };
