import * as functions from 'firebase-functions';
import { Ticket, TicketStatus } from '../../lots/models';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceSettledEventData,
  BtcPayServerWebhookEvent,
} from '../../services/btcPayServer/models';
import { firebaseFetchTickets } from '../../services/firebase/firebaseFetchTickets';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { maybePluralise } from '../../utils/maybePluralise';
import { firebaseSaveTickets } from '../../services/firebase/firebaseSaveTickets';
import { changeTicketsStatus } from '../changeTicketsStatus';
import { validateWebookEventData } from '../validateWebhookEventData';
import { sendNotification } from '../sendNotification';

require('dotenv').config();

// FIXME: improve and test this
export const getBankerNotification = ({
  confirmedTickets,
}: {
  confirmedTickets: Ticket[];
}): {
  title: string;
  body: string;
} => {
  return {
    title: `We've just confirmed ${maybePluralise(
      confirmedTickets.length,
      'ticket',
    )} 🎉`,
    body: "You're officially in today's draw 🤞",
  };
};

type Response = FirebaseFunctionResponse<void>;

export const runBanker = async (
  data: BtcPayServerInvoiceSettledEventData,
  dependencies: {
    validateWebookEventData: typeof validateWebookEventData;
    firebaseFetchTickets: typeof firebaseFetchTickets;
    changeTicketsStatus: typeof changeTicketsStatus;
    firebaseSaveTickets: typeof firebaseSaveTickets;
    sendNotification: typeof sendNotification;
  } = {
    validateWebookEventData,
    firebaseFetchTickets,
    changeTicketsStatus,
    firebaseSaveTickets,
    sendNotification,
  },
): Promise<Response> => {
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
  const paymentReceivedTickets = await dependencies.firebaseFetchTickets({
    lotId,
    uid,
    ticketIds,
    ticketStatuses: [TicketStatus.paymentReceived],
  });

  if (!paymentReceivedTickets.length) {
    // should not be possible
    return {
      error: true,
      message: 'Tickets missing fool.',
    };
  }

  // mark the remaining tickets as confirmed
  // NOTE: we mark all tickets as confirmed because it's not possible to get the InvoiceSettled
  // event for partial payments
  // NOTE: it should also not be possible to get an over payment at this stage
  // that will be handled in the InvoiceReceivedPayment webhook
  const confirmedTickets: Ticket[] = dependencies.changeTicketsStatus(
    paymentReceivedTickets,
    TicketStatus.confirmed,
  );

  // write the confirmed tickets to firebase
  await dependencies.firebaseSaveTickets(lotId, confirmedTickets);

  // notify the user that their tickets were confirmed
  const notification = getBankerNotification({
    confirmedTickets,
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
