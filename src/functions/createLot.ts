import moment = require('moment');
import {
  LotId,
  TARGET_LOT_VALUE_USD,
  TARGET_TICKET_VALUE_USD,
  TICKET_COMMISSION_PERCENTAGE,
} from '../lots/models';
import { createStore } from '../services/btcPayServer/createStore';
import { createStoreWallet } from '../services/btcPayServer/createStoreWallet';
import { createWebhook } from '../services/btcPayServer/createWebhook';
import { firebaseCreateLot } from '../services/firebase/firebaseCreateLot';
import { firebaseSaveStoreData } from '../services/firebase/firebaseSaveStoreData';
import { createMnemonic } from '../utils/createMnemonic';
import { encrypt } from '../utils/crypto';
import {
  makeBtcPayServerStore,
  makeBtcPayServerWebhook,
} from '../services/btcPayServer/data';
import { makeLot } from '../lots/data';
import { BtcPayServerWebhookEvent } from '../services/btcPayServer/models';
import { firebaseFetchLot } from '../services/firebase/firebaseFetchLot';
import { FirebaseFunctionResponse } from '../services/firebase/models';

require('dotenv').config();

// we want each lot to be valued at a certain USD amount
// we also want to set the price of a ticket to a reasonable USD amount
// we also want to make a commission
// there is also fluctuation that happens
// therefore, we need to calculate the number of tickets that we should make available
// after giving the winner their USD lot value (after our commission)
export const getTicketsAvailable = ({
  targetLotValueUSD,
  targetTicketValueUSD,
  ticketCommissionPercentage,
  avgBTCDailyFluctuationPercentage,
}: {
  targetLotValueUSD: number;
  targetTicketValueUSD: number;
  ticketCommissionPercentage: number;
  avgBTCDailyFluctuationPercentage: number;
}): number => {
  const targetTicketValueUSDAfterCommission =
    (targetTicketValueUSD *
      (100 - ticketCommissionPercentage - avgBTCDailyFluctuationPercentage)) /
    100;
  const totalAvailableTickets = Math.ceil(
    targetLotValueUSD / targetTicketValueUSDAfterCommission,
  );

  return totalAvailableTickets;
};

export const getLotId = () => moment().format('YYYY-MM-DD'); // the id is the day

export const getPaymentReceivedWebhook = () =>
  makeBtcPayServerWebhook({
    url: process.env.INVOICE_RECEIVED_PAYMENT_WEBHOOK_URL,
    specificEvents: [BtcPayServerWebhookEvent.invoiceReceivedPayment], // once the tx is broadcasted on the blockchain
    secret: process.env.WEBHOOK_SECRET,
  });

export const getInvoiceSettledWebhook = () =>
  makeBtcPayServerWebhook({
    url: process.env.INVOICE_SETTLED_WEBHOOK_URL,
    specificEvents: [
      BtcPayServerWebhookEvent.invoiceSettled,
      BtcPayServerWebhookEvent.invoicePaymentSettled,
    ], // once the tx is confirmed or manually settled, we'll receive this webhook
    secret: process.env.WEBHOOK_SECRET,
  });

export const getInvoiceExpiredWebhook = () =>
  makeBtcPayServerWebhook({
    url: process.env.INVOICE_EXPIRED_WEBHOOK_URL,
    specificEvents: [
      BtcPayServerWebhookEvent.invoiceExpired,
      BtcPayServerWebhookEvent.invoiceInvalid,
    ], // if invoice expires or manually marked as invalid
    secret: process.env.WEBHOOK_SECRET,
  });

type Response = FirebaseFunctionResponse<void>;

export const createLot = async (
  dependencies: {
    firebaseFetchLot: typeof firebaseFetchLot;
    createStore: typeof createStore;
    createStoreWallet: typeof createStoreWallet;
    firebaseSaveStoreData: typeof firebaseSaveStoreData;
    createWebhook: typeof createWebhook;
    firebaseCreateLot: typeof firebaseCreateLot;
  } = {
    firebaseFetchLot,
    createStore,
    createStoreWallet,
    firebaseSaveStoreData,
    createWebhook,
    firebaseCreateLot,
  },
): Promise<Response> => {
  const lotId: LotId = getLotId();

  // check if the lot already exists
  const lotExists = await dependencies.firebaseFetchLot(lotId);

  if (lotExists) {
    const message = `lot with id ${lotId} already exists fool.`;

    console.log('createLot:', message);

    return {
      error: true,
      message,
    };
  }

  const totalAvailableTickets = getTicketsAvailable({
    targetLotValueUSD: TARGET_LOT_VALUE_USD,
    targetTicketValueUSD: TARGET_TICKET_VALUE_USD,
    ticketCommissionPercentage: TICKET_COMMISSION_PERCENTAGE,
    avgBTCDailyFluctuationPercentage: 2, // FIXME: in the future we could make this dynamic
  });

  // create the store
  const store = makeBtcPayServerStore({ name: lotId });
  const { id: storeId } = await dependencies.createStore(store);

  // create the store wallet
  const mnemonic = createMnemonic();

  await dependencies.createStoreWallet(storeId, {
    existingMnemonic: mnemonic,
    passphrase: process.env.STORE_WALLET_SECRET_KEY,
  });

  // save the mnemonic created above in case we need to retrieve it later
  const hash = encrypt(mnemonic, process.env.STORE_MNEMONIC_SECRET_KEY);
  await dependencies.firebaseSaveStoreData(storeId, { hash });

  // create an invoice payment webhook
  const invoicePaymentReceivedWebhook = getPaymentReceivedWebhook();
  await dependencies.createWebhook(storeId, invoicePaymentReceivedWebhook);

  // create an invoice settled webhook
  const invoiceSettledWebhook = getInvoiceSettledWebhook();
  await dependencies.createWebhook(storeId, invoiceSettledWebhook);

  // create an invoice expiry webhook
  const invoiceExpiredWebhook = getInvoiceExpiredWebhook();
  await dependencies.createWebhook(storeId, invoiceExpiredWebhook);

  // create the lot
  const lot = makeLot({
    id: lotId,
    totalAvailableTickets,
  });
  await dependencies.firebaseCreateLot(lot);

  console.log(
    `successfully created lot with id ${lotId} and ${totalAvailableTickets} available tickets.`,
  );

  return {
    error: false,
    message: 'great success!',
  };
};
