import * as functions from 'firebase-functions';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceSettledEventData,
  BtcPayServerWebhookEvent,
} from '../../services/btcPayServer/models';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { maybePluralise } from '../../utils/maybePluralise';
import { validateWebookEventData } from '../validateWebhookEventData';
import { sendNotification } from '../sendNotification';
import { verifyWebhookSignature } from '../verifyWebhookSignature';
import { firebaseUpdateInvoice } from '../../services/firebase/firebaseUpdateInvoice';
import { InvoiceStatus } from '../../store/invoices/models';

require('dotenv').config();

// FIXME: improve and test this
export const getBankerNotification = ({
  confirmedTicketCount,
}: {
  confirmedTicketCount: number;
}): {
  title: string;
  body: string;
} => {
  return {
    title: `We've just confirmed ${maybePluralise(
      confirmedTicketCount,
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
    firebaseUpdateInvoice: typeof firebaseUpdateInvoice;
    sendNotification: typeof sendNotification;
  } = {
    validateWebookEventData,
    firebaseUpdateInvoice,
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

  // update the invoice status in firebase
  await dependencies.firebaseUpdateInvoice({
    lotId,
    invoiceId: invoice.id,
    data: { status: InvoiceStatus.confirmed },
  });

  // notify the user that their tickets were confirmed
  const notification = getBankerNotification({
    confirmedTicketCount: ticketIds.length,
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
