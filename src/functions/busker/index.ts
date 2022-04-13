import * as functions from 'firebase-functions';
import { Ticket, TicketStatus } from '../../models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import { BtcPayServerInvoiceExpiredEventData } from '../../services/btcPayServer/models';
import { firebaseFetchTicketsByStatus } from '../../services/firebase/firebaseFetchTicketsByStatus';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { saveTickets } from '../saveTickets';
import { markTicketsStatus } from '../markTicketsStatus';

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

  // fetch the tickets using the ticketIds in the invoice
  const tickets = await firebaseFetchTicketsByStatus({
    lotId,
    ticketIds: invoice.metadata.ticketIds,
    ticketStatus: TicketStatus.awaitingPayment,
  });

  if (!tickets.length) {
    return {
      error: true,
      message: 'No tickets left to expire.',
      data: undefined,
    };
  }

  // mark the remaining tickets as expired
  // NOTE: here we can mark all the tickets as expired because ? (my kids are distracting me)
  const expiredTickets: Ticket[] = markTicketsStatus(
    tickets,
    TicketStatus.expired,
  );

  // write the expired tickets to firebase
  await saveTickets(lotId, expiredTickets);

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

    const data: BtcPayServerInvoiceExpiredEventData = request.body;

    // ignore all other webhook events in case the webhook was not set up correctly
    if (data.type !== 'InvoiceExpired' && data.type !== 'InvoiceInvalid') {
      response.status(200).send(`Received ${data.type} event.`);

      return;
    }

    try {
      const buskerResponse = await runBusker(data);

      response.status(200).send(buskerResponse.message);
    } catch (error) {
      response.status(200).send((error as Error).message);
    }
  },
);

export { busker };
