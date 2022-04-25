import * as functions from 'firebase-functions';
import { MAX_BTC_DIGITS, Ticket, TicketStatus } from '../../lots/models';
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
import { numberToDigits } from '../../utils/numberToDigits';
import { getInvoicePaymentMethods } from '../../services/btcPayServer/getInvoicePaymentMethods';
import { Payment } from '../../payments/models';
import { sortArrayOfObjectsByKey } from '../../utils/sortArrayOfObjectsByKey';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import moment = require('moment');
import { firebaseCreatePayment } from '../../services/firebase/firebaseCreatePayment';

require('dotenv').config();

// FIXME: improve and test this
export const getBagmanNotification = ({
  hasPaidInFull,
  paymentAmountBTC,
  totalPaidBTC,
  invoiceTotalBTC,
  paidTicketCount,
}: {
  hasPaidInFull: boolean;
  paymentAmountBTC: number;
  totalPaidBTC: number;
  invoiceTotalBTC: number;
  paidTicketCount: number;
}): {
  title: string;
  body: string;
} => {
  return {
    title: `We've just received a payment from you 😎`,
    body: hasPaidInFull
      ? `You paid ${paymentAmountBTC} BTC. Once your transaction has received 6 confirmations on the blockchain, we'll enter your ${maybePluralise(
          paidTicketCount,
          'ticket',
        )} into today's draw 🤞`
      : `You paid ${paymentAmountBTC} BTC. We now have ${totalPaidBTC} out of ${invoiceTotalBTC} BTC. Please send the remainder of ${numberToDigits(
          invoiceTotalBTC - totalPaidBTC,
          MAX_BTC_DIGITS,
        )} BTC soon to avoid expiration of your tickets.`,
  };
};

export type BagmanResponse = FirebaseFunctionResponse<void>;

// bagman is a webhook for the InvoiceReceivedPaymentEvent
// he'll mark an invoices ticket statuses as Payment Received if we have the full payment
export const runBagman = async (
  data: BtcPayServerInvoiceReceivedPaymentEventData,
  dependencies: {
    validateWebookEventData: typeof validateWebookEventData;
    firebaseFetchLot: typeof firebaseFetchLot;
    getInvoicePaymentMethods: typeof getInvoicePaymentMethods;
    firebaseCreatePayment: typeof firebaseCreatePayment;
    firebaseFetchTickets: typeof firebaseFetchTickets;
    changeTicketsStatus: typeof changeTicketsStatus;
    firebaseSaveTickets: typeof firebaseSaveTickets;
    sendNotification: typeof sendNotification;
  } = {
    validateWebookEventData,
    firebaseFetchLot,
    getInvoicePaymentMethods,
    firebaseCreatePayment,
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

  const invoiceId = invoice.id;
  const paymentMethods = await dependencies.getInvoicePaymentMethods({
    storeId: invoice.storeId,
    invoiceId,
  });
  const defaultPaymentMethod = paymentMethods[0];
  const totalPaidBTC = parseFloat(defaultPaymentMethod.totalPaid);
  const invoiceTotalBTC = parseFloat(defaultPaymentMethod.amount);
  const paymentAmountBTC = parseFloat(data.payment.value);
  const hasPaidInFull = !parseFloat(defaultPaymentMethod.due);

  // save the payment
  const latestPayment = sortArrayOfObjectsByKey(
    defaultPaymentMethod.payments,
    'receivedDate',
    true,
  )[0];
  const txId = latestPayment.id.split('-')[0]; // btcPayServer concats a "-INT" onto the txId for some reason
  const payment: Payment = {
    id: latestPayment.id,
    uid,
    txId,
    lotId,
    invoiceId,
    amountBTC: paymentAmountBTC,
    receivedDate: getTimeAsISOString(moment(latestPayment.receivedDate * 1000)),
    destination: latestPayment.destination,
  };

  await dependencies.firebaseCreatePayment({ lotId, invoiceId, payment });

  if (!hasPaidInFull) {
    console.log(
      `bagman: ${uid} partially paid ${paymentAmountBTC} BTC of the invoice total, $${invoice.amount}.`,
    );

    // notify the user
    const notification = getBagmanNotification({
      hasPaidInFull,
      paymentAmountBTC,
      totalPaidBTC,
      invoiceTotalBTC,
      paidTicketCount: 0,
    });
    const sendNotificationResponse = await dependencies.sendNotification({
      uid,
      notification,
    });

    return sendNotificationResponse;
  }

  // mark the ticket's statuses
  const paidTickets: Ticket[] = dependencies.changeTicketsStatus(
    reservedTickets,
    TicketStatus.paymentReceived,
  );

  console.log(
    `bagman: ${uid} paid ${paymentAmountBTC} BTC of the invoice total, $${invoice.amount} and we are marking ${reservedTickets.length} tickets as Payment Received.`,
  );

  // update the tickets in firebase
  await dependencies.firebaseSaveTickets(lotId, paidTickets);

  // notify the user that their payment was received
  const notification = getBagmanNotification({
    hasPaidInFull: true,
    paymentAmountBTC,
    totalPaidBTC,
    invoiceTotalBTC,
    paidTicketCount: paidTickets.length,
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
