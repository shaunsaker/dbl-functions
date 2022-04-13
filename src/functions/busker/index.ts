import * as functions from 'firebase-functions';
import { Ticket, TicketStatus } from '../../models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import { BtcPayServerInvoiceExpiredEventData } from '../../services/btcPayServer/models';
import { firebaseFetchTickets } from '../../services/firebase/firebaseFetchTickets';
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

  // fetch the reserved tickets using the ticketIds in the invoice
  const reservedTickets = await firebaseFetchTickets({
    lotId,
    uid,
    ticketIds: invoice.metadata.ticketIds,
    ticketStatuses: [TicketStatus.reserved],
  });

  if (!reservedTickets.length) {
    return {
      error: true,
      message: 'No reservedTickets left to expire 🤔',
    };
  }

  // mark the remaining reserved tickets as expired
  // NOTE: here we can mark all the reserved tickets as expired
  const expiredTickets: Ticket[] = markTicketsStatus(
    reservedTickets,
    TicketStatus.expired,
  );

  // write the expired tickets to firebase
  await saveTickets(lotId, expiredTickets);

  return {
    error: false,
    message: 'Great Success!',
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
