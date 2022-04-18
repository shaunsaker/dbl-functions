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
import { firebaseSendNotification } from '../../services/firebase/firebaseSendNotification';
import { firebaseFetchUserProfile } from '../../services/firebase/firebaseFetchUserProfile';

export type BagmanResponse = FirebaseFunctionResponse<void>;

// bagman is a webhook for the InvoiceReceivedPaymentEvent
// he'll mark an invoices ticket statuses as Payment Received
// he also handles partial payments and over payments
export const runBagman = async (
  data: BtcPayServerInvoiceReceivedPaymentEventData,
  dependencies: {
    getInvoice: typeof getInvoice;
    firebaseFetchUserProfile: typeof firebaseFetchUserProfile;
    firebaseFetchLot: typeof firebaseFetchLot;
    firebaseFetchTickets: typeof firebaseFetchTickets;
    markTicketsStatus: typeof markTicketsStatus;
    saveTickets: typeof saveTickets;
    createTickets: typeof createTickets;
    updateInvoice: typeof updateInvoice;
    firebaseSendNotification: typeof firebaseSendNotification;
  } = {
    getInvoice,
    firebaseFetchUserProfile,
    firebaseFetchLot,
    firebaseFetchTickets,
    markTicketsStatus,
    saveTickets,
    createTickets,
    updateInvoice,
    firebaseSendNotification,
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

  // fetch the user profile
  const userProfileData = await dependencies.firebaseFetchUserProfile(lotId);

  if (!userProfileData) {
    return {
      error: true,
      message: 'User data missing fool.',
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

  // handle partial payments by only reserving the tickets to the value of the payment
  // e.g. if I reserved 5 tickets but only paid for 3, only reserve 3
  // NOTE: keep in mind that this could also be an over payment
  const paymentAmountUSD = parseFloat(data.payment.value);
  const paymentAmountBTC = paymentAmountUSD / lot.BTCPriceInUSD;
  const quantityTicketsReservable = Math.floor(
    paymentAmountBTC / lot.ticketPriceInBTC,
  );
  const reservableTickets = reservedTickets.slice(0, quantityTicketsReservable);

  // mark the ticket's statuses
  const paidTickets: Ticket[] = dependencies.markTicketsStatus(
    reservableTickets,
    TicketStatus.paymentReceived,
  );

  // update the tickets in firebase
  await dependencies.saveTickets(lotId, paidTickets);

  // notify the user that their payment was received
  for await (const fcmToken of userProfileData.fcmTokens) {
    await dependencies.firebaseSendNotification({
      title: `We've just received payment of ${paymentAmountBTC} BTC from you 😎`,
      body:
        paidTickets.length > 0
          ? `This was enough for ${maybePluralise(
              paidTickets.length,
              'ticket',
            )}. Once your transaction has received 6 confirmations on the blockchain, we'll enter your ticket${
              paidTickets.length > 1 ? 's' : ''
            } into today's draw 🤞`
          : "Unfortunately, this wasn't enough for any of your reserved tickets. Please deposit more.",
      token: fcmToken,
    });
  }

  return {
    error: false,
    message:
      paidTickets.length > 0
        ? `Great Success! ${maybePluralise(paidTickets.length, 'ticket')} ${
            paidTickets.length > 1 ? 'were' : 'was'
          } marked as paymentReceived.`
        : 'Epic Fail! User could not afford any tickets.',
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
