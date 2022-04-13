import * as functions from 'firebase-functions';
import { Lot, Ticket, TicketStatus } from '../../models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import {
  BtcPayServerInvoiceMetadata,
  BtcPayServerInvoiceReceivedPaymentEventData,
} from '../../services/btcPayServer/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseFetchTickets } from '../../services/firebase/firebaseFetchTickets';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { maybePluralise } from '../../utils/maybePluralise';
import { saveTickets } from '../saveTickets';
import { markTicketsStatus } from '../markTicketsStatus';
import { createTickets } from '../createTickets';
import { updateInvoice } from '../../services/btcPayServer/updateInvoice';

// update the remainining tickets available so that users
// don't purchase tickets over our limit
const updateLotStats = async (lot: Lot, tickets: Ticket[]): Promise<void> => {
  const { ticketsAvailable } = lot;
  const newTicketsAvailable = ticketsAvailable - tickets.length;
  const newLot: Partial<Lot> = {
    ticketsAvailable: newTicketsAvailable,
  };

  await firebaseUpdateLot(lot.id, newLot);
};

type Response = FirebaseFunctionResponse<void>;

export const runBagman = async (
  data: BtcPayServerInvoiceReceivedPaymentEventData,
): Promise<Response> => {
  // we need to get the lotId and uid from the invoice
  // so we need to fetch the invoice
  const { storeId, invoiceId } = data;

  if (!storeId) {
    return {
      error: true,
      message: 'storeId missing fool.',
      data: undefined,
    };
  }

  if (!invoiceId) {
    return {
      error: true,
      message: 'invoiceId missing fool.',
      data: undefined,
    };
  }

  const invoice = await getInvoice({ storeId, invoiceId });

  if (!invoice) {
    return {
      error: true,
      message: 'Invoice missing fool.',
      data: undefined,
    };
  }

  const { lotId, uid } = invoice.metadata;

  if (!lotId) {
    return {
      error: true,
      message: 'lotId missing from invoice fool.',
      data: undefined,
    };
  }

  if (!uid) {
    return {
      error: true,
      message: 'uid missing from invoice fool.',
      data: undefined,
    };
  }

  // fetch the tickets using the ticketIds in the invoice
  const tickets = await firebaseFetchTickets({
    lotId,
    uid,
    ticketIds: invoice.metadata.ticketIds,
    ticketStatuses: [TicketStatus.awaitingPayment],
  });

  // fetch the lot
  const lot = await firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Lot missing fool.',
      data: undefined,
    };
  }

  const paymentAmountUSD = parseFloat(data.payment.value);
  const paymentAmountBTC = paymentAmountUSD / lot.BTCPriceInUSD;
  const ticketPriceInBTC = lot.ticketPriceInBTC;

  // handle partial payments by only reserving the tickets to the value of the payment
  // e.g. if I reserved 5 tickets but only paid for 3, only reserve 3
  // NOTE: keep in mind that this could also be an over payment
  const quantityTicketsReservable = Math.floor(
    paymentAmountBTC / ticketPriceInBTC,
  );
  const hasUserOverpaidOrPaidLate = quantityTicketsReservable > tickets.length;
  const reservableTickets = hasUserOverpaidOrPaidLate
    ? tickets
    : tickets.slice(0, quantityTicketsReservable - 1);
  const reservedTickets: Ticket[] = markTicketsStatus(
    reservableTickets,
    TicketStatus.reserved,
  );

  // write the reserved tickets to firebase
  await saveTickets(lotId, reservedTickets);

  // update the lot stats
  // TODO: SS this will be a new function based on ticket changes
  await updateLotStats(lot, reservedTickets);

  // handle over payments by creating new reserved tickets
  if (hasUserOverpaidOrPaidLate) {
    // check how much they overpaid by create new reserved tickets based on that
    // as well as adding the new ticketIds to the existing invoice
    const quantityNewTicketsToReserve =
      quantityTicketsReservable - tickets.length;

    // create the tickets
    const createTicketsResponse = await createTickets({
      lot,
      uid,
      ticketCount: quantityNewTicketsToReserve,
      ticketPriceInBTC: lot.ticketPriceInBTC,
      ticketStatus: TicketStatus.reserved, // we already received the payment so mark them as reserved
    });

    if (createTicketsResponse.error) {
      return {
        error: true,
        message: createTicketsResponse.message,
        data: undefined,
      };
    }

    if (!createTicketsResponse.data) {
      return {
        error: true,
        message: 'No ticketIds 🤔',
        data: undefined,
      };
    }

    //  update the existing invoice with the new ticket ids
    const newInvoiceMetadata: BtcPayServerInvoiceMetadata = {
      ...invoice.metadata,
      ticketIds: [...invoice.metadata.ticketIds, ...createTicketsResponse.data],
    };

    await updateInvoice(storeId, invoiceId, { metadata: newInvoiceMetadata });
  }

  return {
    error: false,
    message: `Great Success!  ${maybePluralise(
      reservedTickets.length,
      'ticket',
    )} were marked as reserved.`,
    data: undefined,
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
    if (data.type !== 'InvoiceReceivedPayment') {
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
