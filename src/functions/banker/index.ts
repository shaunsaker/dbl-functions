import * as functions from 'firebase-functions';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceSettledEventData,
  BtcPayServerWebhookEvent,
} from '../../services/btcPayServer/models';
import { firebaseFetchTickets } from '../../services/firebase/firebaseFetchTickets';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { maybePluralise } from '../../utils/maybePluralise';
import { firebaseSaveTickets } from '../../services/firebase/firebaseSaveTickets';
import { changeTicketsStatus } from '../changeTicketsStatus';
import { validateWebookEventData } from '../validateWebhookEventData';
import { sendNotification } from '../sendNotification';
import { verifyWebhookSignature } from '../verifyWebhookSignature';
import { Ticket, TicketStatus } from '../../store/tickets/models';

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
    const message = validateWebhookEventDataResponse.message;

    console.log(`banker: ${message}`);

    return {
      error: true,
      message: validateWebhookEventDataResponse.message,
    };
  }

  // if there is no invoice, validateWebookEventData will return an error
  const invoice = validateWebhookEventDataResponse.data as BtcPayServerInvoice;
  const { uid, lotId, ticketIds } = invoice.metadata;

  // fetch the tickets using the ticketIds in the invoice
  const tickets = await dependencies.firebaseFetchTickets({
    lotId,
    uid,
    ticketIds,
    // we fetch reserved tickets too in case there was a manual settlement
    ticketStatuses: [TicketStatus.reserved, TicketStatus.paymentReceived],
  });

  if (!tickets.length) {
    // should not be possible
    const message = 'tickets missing fool.';

    console.log(`banker: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // mark the remaining tickets as confirmed
  // NOTE: we mark all tickets as confirmed because it's not possible to get the InvoiceSettled
  // event for partial payments
  // NOTE: it should also not be possible to get an over payment at this stage
  // that will be handled in the InvoiceReceivedPayment webhook
  const confirmedTickets: Ticket[] = dependencies.changeTicketsStatus(
    tickets,
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
    const message = sendNotificationResponse.message;

    console.log(`banker: ${message}`);

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

const banker = functions
  .region('europe-west1')
  .https.onRequest(async (request, response): Promise<void> => {
    const verifyWebhookSignatureResponse = verifyWebhookSignature(request);

    if (verifyWebhookSignatureResponse.error) {
      const message = verifyWebhookSignatureResponse.message;

      console.log(`bagman: ${message}`);

      response.status(200).send(message); // webhook needs 200 otherwise it will try redeliver continuously

      return;
    }

    const data: BtcPayServerInvoiceSettledEventData = request.body;

    // ignore all other webhook events in case the webhook was not set up correctly
    if (
      data.type !== BtcPayServerWebhookEvent.invoiceSettled &&
      data.type !== BtcPayServerWebhookEvent.invoicePaymentSettled
    ) {
      const message = `ignoring webhook event, ${data.type}, fool.`;

      console.log(`banker: ${message}`);

      response.status(200).send(message);

      return;
    }

    try {
      const bankerResponse = await runBanker(data);

      response.status(200).send(bankerResponse.message);
    } catch (error) {
      const message = (error as Error).message;

      console.log(`banker: ${message}`);

      response.status(200).send(message);
    }
  });

export { banker };
