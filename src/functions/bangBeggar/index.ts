import * as functions from 'firebase-functions';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceExpiredEventData,
  BtcPayServerWebhookEvent,
} from '../../services/btcPayServer/models';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { validateWebookEventData } from '../validateWebhookEventData';
import { notifyUser } from '../notifyUser';
import { maybePluralise } from '../../utils/maybePluralise';
import { verifyWebhookSignature } from '../verifyWebhookSignature';
import { InvoiceStatus } from '../../store/invoices/models';
import { firebaseUpdateInvoice } from '../../services/firebase/firebaseUpdateInvoice';

require('dotenv').config();

// FIXME: improve and test this
export const getBangBeggarNotification = ({
  expiredTicketCount,
}: {
  expiredTicketCount: number;
}): {
  title: string;
  description: string;
} => {
  return {
    title: `We've just expired ${maybePluralise(
      expiredTicketCount,
      'ticket',
    )} 😔`,
    description:
      "To keep things fair, if we don't receive payment within 15 minutes, we expire those tickets for other users. please try again.",
  };
};

type Response = FirebaseFunctionResponse<void>;

export const runBangBeggar = async (
  data: BtcPayServerInvoiceExpiredEventData,
  dependencies: {
    validateWebookEventData: typeof validateWebookEventData;
    firebaseUpdateInvoice: typeof firebaseUpdateInvoice;
    notifyUser: typeof notifyUser;
  } = {
    validateWebookEventData,
    firebaseUpdateInvoice,
    notifyUser,
  },
): Promise<Response> => {
  const validateWebhookEventDataResponse =
    await dependencies.validateWebookEventData(data);

  if (validateWebhookEventDataResponse.error) {
    const message = validateWebhookEventDataResponse.message;

    console.log(`bangBeggar: ${message}`);

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
    data: { status: InvoiceStatus.expired },
  });

  // notify the user that their payment was received
  const notification = getBangBeggarNotification({
    expiredTicketCount: ticketIds.length,
  });
  const sendNotificationResponse = await dependencies.notifyUser({
    uid,
    notification,
  });

  if (sendNotificationResponse.error) {
    const message = sendNotificationResponse.message;

    console.log(`bangBeggar: ${message}`);

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

const bangBeggar = functions
  .region('europe-west1')
  .https.onRequest(async (request, response): Promise<void> => {
    const verifyWebhookSignatureResponse = verifyWebhookSignature(request);

    if (verifyWebhookSignatureResponse.error) {
      const message = verifyWebhookSignatureResponse.message;

      console.log(`bagman: ${message}`);

      response.status(200).send(message); // webhook needs 200 otherwise it will try redeliver continuously

      return;
    }

    const data: BtcPayServerInvoiceExpiredEventData = request.body;

    // ignore all other webhook events in case the webhook was not set up correctly
    if (
      data.type !== BtcPayServerWebhookEvent.invoiceExpired &&
      data.type !== BtcPayServerWebhookEvent.invoiceInvalid
    ) {
      const message = `ignoring webhook event, ${data.type}, fool.`;

      console.log(`bangBeggar: ${message}`);

      response.status(200).send(message);

      return;
    }

    try {
      const bangBeggarResponse = await runBangBeggar(data);

      response.status(200).send(bangBeggarResponse.message);
    } catch (error) {
      const message = (error as Error).message;

      console.log(`bangBeggar: ${message}.`);

      response.status(200).send(message);
    }
  });

export { bangBeggar };
