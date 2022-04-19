import moment = require('moment');
import {
  LotId,
  TARGET_LOT_VALUE_USD,
  TARGET_TICKET_VALUE_USD,
  TICKET_COMMISSION_PERCENTAGE,
} from '../lots/models';
import { getBTCUSDPrice } from '../services/coinGecko/getBTCUSDPrice';
import { createStore } from '../services/btcPayServer/createStore';
import { createStoreWallet } from '../services/btcPayServer/createStoreWallet';
import { createWebhook } from '../services/btcPayServer/createWebhook';
import { firebaseCreateLot } from '../services/firebase/firebaseCreateLot';
import { firebaseSaveStoreData } from '../services/firebase/firebaseSaveStoreData';
import { createMnemonic } from '../utils/createMnemonic';
import { encrypt } from '../utils/crypto';
import { numberToDigits } from '../utils/numberToDigits';
import {
  makeBtcPayServerStore,
  makeBtcPayServerWebhook,
} from '../services/btcPayServer/data';
import { makeLot } from '../lots/data';
import { BtcPayServerWebhookEvent } from '../services/btcPayServer/models';

require('dotenv').config();

export const getTicketsAvailable = ({
  targetLotValueUSD,
  targetTicketValueUSD,
}: {
  targetLotValueUSD: number;
  targetTicketValueUSD: number;
}): number => {
  // calculate the amount of tickets available
  return Math.ceil(targetLotValueUSD / targetTicketValueUSD);
};

export const getTicketPrice = ({
  targetLotValueUSD,
  BTCPriceInUSD,
  ticketsAvailable,
  ticketCommissionPercentage,
}: {
  targetLotValueUSD: number;
  BTCPriceInUSD: number;
  ticketsAvailable: number;
  ticketCommissionPercentage: number;
}): number => {
  // calculate the ticket price
  const targetLotValueBTC = targetLotValueUSD / BTCPriceInUSD;
  const ticketPriceWithoutCommissionInBTC =
    targetLotValueBTC / ticketsAvailable;
  const ticketPriceInBTC = numberToDigits(
    ticketPriceWithoutCommissionInBTC * (100 + ticketCommissionPercentage),
    6,
  );

  return ticketPriceInBTC;
};

export const getTicketCommission = ({
  ticketPriceInBTC,
  ticketCommissionPercentage,
}: {
  ticketPriceInBTC: number;
  ticketCommissionPercentage: number;
}): number => {
  // calculate the commission
  const ticketCommissionInBTC = numberToDigits(
    (ticketPriceInBTC * ticketCommissionPercentage) / 100,
    6,
  );

  return ticketCommissionInBTC;
};

export const getLotId = () => moment().startOf('day').format('YYYY-MM-DD'); // the id is the day

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

export const createLot = async (
  dependencies: {
    getBTCUSDPrice: typeof getBTCUSDPrice;
    createStore: typeof createStore;
    createStoreWallet: typeof createStoreWallet;
    firebaseSaveStoreData: typeof firebaseSaveStoreData;
    createWebhook: typeof createWebhook;
    firebaseCreateLot: typeof firebaseCreateLot;
  } = {
    getBTCUSDPrice,
    createStore,
    createStoreWallet,
    firebaseSaveStoreData,
    createWebhook,
    firebaseCreateLot,
  },
): Promise<void> => {
  // fetch the btc price in usd
  const BTCPriceInUSD = await dependencies.getBTCUSDPrice();

  const ticketsAvailable = getTicketsAvailable({
    targetLotValueUSD: TARGET_LOT_VALUE_USD,
    targetTicketValueUSD: TARGET_TICKET_VALUE_USD,
  });
  const ticketPriceInBTC = getTicketPrice({
    targetLotValueUSD: TARGET_LOT_VALUE_USD,
    BTCPriceInUSD,
    ticketsAvailable,
    ticketCommissionPercentage: TICKET_COMMISSION_PERCENTAGE,
  });
  const ticketCommissionInBTC = getTicketCommission({
    ticketPriceInBTC,
    ticketCommissionPercentage: TICKET_COMMISSION_PERCENTAGE,
  });

  // create the store
  const lotId: LotId = getLotId();
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
    BTCPriceInUSD,
    ticketPriceInBTC,
    ticketCommissionInBTC,
    ticketsAvailable,
  });
  await dependencies.firebaseCreateLot(lot);
};
