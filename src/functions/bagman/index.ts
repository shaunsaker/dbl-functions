import * as functions from 'firebase-functions';
import { Ticket, TicketStatus } from '../../lots/models';
import {
  BtcPayServerInvoice,
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
import { validateWebookEventData } from '../validateWebhookEventData';
import { sendNotification } from '../sendNotification';

// FIXME: improve and test this
export const getBagmanNotification = ({
  paymentAmountBTC,
  paidTickets,
}: {
  paymentAmountBTC: number;
  paidTickets: Ticket[];
}): {
  title: string;
  body: string;
} => {
  return {
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
  };
};

export type BagmanResponse = FirebaseFunctionResponse<void>;

// bagman is a webhook for the InvoiceReceivedPaymentEvent
// he'll mark an invoices ticket statuses as Payment Received
// he also handles partial payments
export const runBagman = async (
  data: BtcPayServerInvoiceReceivedPaymentEventData,
  dependencies: {
    validateWebookEventData: typeof validateWebookEventData;
    firebaseFetchLot: typeof firebaseFetchLot;
    firebaseFetchTickets: typeof firebaseFetchTickets;
    markTicketsStatus: typeof markTicketsStatus;
    saveTickets: typeof saveTickets;
    sendNotification: typeof sendNotification;
  } = {
    validateWebookEventData,
    firebaseFetchLot,
    firebaseFetchTickets,
    markTicketsStatus,
    saveTickets,
    sendNotification,
  },
): Promise<BagmanResponse> => {
  const validateWebhookEventDataResponse =
    await dependencies.validateWebookEventData(data);

  if (validateWebhookEventDataResponse.error) {
    return {
      error: true,
      message: validateWebhookEventDataResponse.message,
    };
  }

  // if there is no invoice, validateWebookEventData will return an error
  const invoice = validateWebhookEventDataResponse.data as BtcPayServerInvoice;
  const { uid, lotId, ticketIds } = invoice.metadata;

  // fetch the tickets using the ticketIds in the invoice
  const reservedTickets = await dependencies.firebaseFetchTickets({
    lotId,
    uid,
    ticketIds,
    ticketStatuses: [TicketStatus.reserved],
  });

  if (!reservedTickets.length) {
    return {
      error: true,
      message: 'Tickets missing fool.',
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
  const notification = getBagmanNotification({
    paymentAmountBTC,
    paidTickets,
  });
  const sendNotificationResponse = await dependencies.sendNotification({
    uid,
    notification,
  });

  if (sendNotificationResponse.error) {
    return {
      error: true,
      message: sendNotificationResponse.message,
    };
  }

  return {
    error: false,
    message: 'Great success!',
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
