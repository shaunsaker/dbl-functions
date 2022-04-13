import * as functions from 'firebase-functions';
import { Lot, Ticket, TicketStatus } from '../../models';
import { getInvoice } from '../../services/btcPayServer/getInvoice';
import { BtcPayServerInvoiceReceivedPaymentEventData } from '../../services/btcPayServer/models';
import { firebaseFetchLot } from '../../services/firebase/firebaseFetchLot';
import { firebaseFetchTicketsByStatus } from '../../services/firebase/firebaseFetchTicketsByStatus';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { verifySignature } from '../../services/btcPayServer/verifySignature';
import { maybePluralise } from '../../utils/maybePluralise';
import { saveTickets } from '../saveTickets';
import { markTicketsStatus } from '../markTicketsStatus';

const getTicketsToValueOfPayment = ({
  paymentAmountUSD,
  BTCPriceInUSD,
  ticketPriceInBTC,
  tickets,
}: {
  paymentAmountUSD: number;
  BTCPriceInUSD: number;
  ticketPriceInBTC: number;
  tickets: Ticket[];
}): Ticket[] => {
  const paymentAmountBTC = paymentAmountUSD / BTCPriceInUSD;
  const remainingAmount = paymentAmountBTC;
  const ticketsToValueOfPayment = tickets.reduce(
    (accummulated: Ticket[], ticket) => {
      if (remainingAmount - ticketPriceInBTC > 0) {
        accummulated.push(ticket);
      }

      return accummulated;
    },
    [],
  );

  return ticketsToValueOfPayment;
};

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
  const tickets = await firebaseFetchTicketsByStatus({
    lotId,
    ticketIds: invoice.metadata.ticketIds,
    ticketStatus: TicketStatus.awaitingPayment,
  });

  if (!tickets.length) {
    return {
      error: true,
      message: 'Free money baby!',
      data: undefined,
    };
  }

  // fetch the lot
  const lot = await firebaseFetchLot(lotId);

  if (!lot) {
    return {
      error: true,
      message: 'Lot missing fool.',
      data: undefined,
    };
  }

  // mark the remaining tickets to the value of the payment (in case it was a partial payment)
  // as reserved
  const paymentAmountUSD = parseFloat(data.payment.value);
  const ticketsToValueOfPayment = getTicketsToValueOfPayment({
    paymentAmountUSD,
    BTCPriceInUSD: lot.BTCPriceInUSD,
    ticketPriceInBTC: lot.ticketPriceInBTC,
    tickets,
  });
  const reservedTickets: Ticket[] = markTicketsStatus(
    ticketsToValueOfPayment,
    TicketStatus.reserved,
  );

  // write the reserved tickets to firebase
  await saveTickets(lotId, reservedTickets);

  // update the lot stats
  await updateLotStats(lot, reservedTickets);

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
