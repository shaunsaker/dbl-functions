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
import { maybePluralise } from '../../utils/maybePluralise';
import { firebaseSaveTickets } from '../../services/firebase/firebaseSaveTickets';
import { changeTicketsStatus } from '../changeTicketsStatus';
import { validateWebookEventData } from '../validateWebhookEventData';
import { sendNotification } from '../sendNotification';
import { verifyWebhookSignature } from '../verifyWebhookSignature';

require('dotenv').config();

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
        : "Unfortunately, this wasn't enough for any of your reserved tickets. please deposit more.",
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
    changeTicketsStatus: typeof changeTicketsStatus;
    firebaseSaveTickets: typeof firebaseSaveTickets;
    sendNotification: typeof sendNotification;
  } = {
    validateWebookEventData,
    firebaseFetchLot,
    firebaseFetchTickets,
    changeTicketsStatus,
    firebaseSaveTickets,
    sendNotification,
  },
): Promise<BagmanResponse> => {
  const validateWebhookEventDataResponse =
    await dependencies.validateWebookEventData(data);

  if (validateWebhookEventDataResponse.error) {
    const message = validateWebhookEventDataResponse.message;

    console.log(`bagman: ${message}`);

    return {
      error: true,
      message,
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
    const message = 'tickets missing fool.';

    console.log(`bagman: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // fetch the lot
  const lot = await dependencies.firebaseFetchLot(lotId);

  if (!lot) {
    const message = 'lot missing fool.';

    console.log(`bagman: ${message}`);

    return {
      error: true,
      message,
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
  const paidTickets: Ticket[] = dependencies.changeTicketsStatus(
    reservableTickets,
    TicketStatus.paymentReceived,
  );

  // update the tickets in firebase
  await dependencies.firebaseSaveTickets(lotId, paidTickets);

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
    const message = sendNotificationResponse.message;

    console.log(`bagman: ${message}`);

    return {
      error: true,
      message,
    };
  }

  return {
    error: false,
    message: 'great success!',
  };
};

const bagman = functions.https.onRequest(
  async (request, response): Promise<void> => {
    const verifyWebhookSignatureResponse = verifyWebhookSignature(request);

    if (verifyWebhookSignatureResponse.error) {
      const message = verifyWebhookSignatureResponse.message;

      console.log(`bagman: ${message}`);

      response.status(200).send(message); // webhook needs 200 otherwise it will try redeliver continuously

      return;
    }

    const data: BtcPayServerInvoiceReceivedPaymentEventData = request.body;

    // ignore all other webhook events in case the webhook was not set up correctly
    if (data.type !== BtcPayServerWebhookEvent.invoiceReceivedPayment) {
      const message = `ignoring webhook event, ${data.type}, fool.`;

      console.log(`bagman: ${message}`);

      response.status(200).send(message);

      return;
    }

    try {
      const bagmanResponse = await runBagman(data);

      response.status(200).send(bagmanResponse.message);
    } catch (error) {
      const message = (error as Error).message;

      console.log(`bagman: ${message}`);

      response.status(200).send(message);
    }
  },
);

export { bagman };
