import * as functions from 'firebase-functions';
import { Ticket, TicketStatus } from '../../lots/models';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceExpiredEventData,
  BtcPayServerWebhookEvent,
} from '../../services/btcPayServer/models';
import { firebaseFetchTickets } from '../../services/firebase/firebaseFetchTickets';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { firebaseSaveTickets } from '../../services/firebase/firebaseSaveTickets';
import { changeTicketsStatus } from '../changeTicketsStatus';
import { validateWebookEventData } from '../validateWebhookEventData';
import { sendNotification } from '../sendNotification';
import { maybePluralise } from '../../utils/maybePluralise';

require('dotenv').config();

// FIXME: improve and test this
export const getBangBeggarNotification = ({
  expiredTickets,
}: {
  expiredTickets: Ticket[];
}): {
  title: string;
  body: string;
} => {
  return {
    title: `We've just expired ${maybePluralise(
      expiredTickets.length,
      'ticket',
    )} 😔`,
    body: "To keep things fair, if we don't receive payment within 15 minutes, we expire those tickets for other users. Please try again.",
  };
};

type Response = FirebaseFunctionResponse<void>;

export const runBangBeggar = async (
  data: BtcPayServerInvoiceExpiredEventData,
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
  const response = await dependencies.validateWebookEventData(data);

  if (response.error) {
    return {
      error: true,
      message: response.message,
    };
  }

  // if there is no invoice, validateWebookEventData will return an error
  const invoice = response.data as BtcPayServerInvoice;
  const { uid, lotId, ticketIds } = invoice.metadata;

  // fetch the reserved tickets using the ticketIds in the invoice
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

  // mark the remaining reserved tickets as expired
  // NOTE: here we can mark all the reserved tickets as expired
  const expiredTickets: Ticket[] = dependencies.changeTicketsStatus(
    reservedTickets,
    TicketStatus.expired,
  );

  // write the expired tickets to firebase
  await dependencies.firebaseSaveTickets(lotId, expiredTickets);

  // notify the user that their payment was received
  const notification = getBangBeggarNotification({
    expiredTickets,
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

const bangBeggar = functions.https.onRequest(
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
    if (
      data.type !== BtcPayServerWebhookEvent.invoiceExpired &&
      data.type !== BtcPayServerWebhookEvent.invoiceInvalid
    ) {
      response.status(200).send(`Received ${data.type} event.`);

      return;
    }

    try {
      const bangBeggarResponse = await runBangBeggar(data);

      response.status(200).send(bangBeggarResponse.message);
    } catch (error) {
      response.status(200).send((error as Error).message);
    }
  },
);

export { bangBeggar };
