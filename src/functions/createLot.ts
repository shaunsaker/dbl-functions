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
import { makeStore, makeWebhook } from '../stores/data';
import { makeLot } from '../lots/data';

export const createLot = async (): Promise<void> => {
  // fetch the btc price in usd
  const BTCPriceInUSD = await getBTCUSDPrice();

  // // calculate the amount of tickets available
  const ticketsAvailable = Math.ceil(
    TARGET_LOT_VALUE_USD / TARGET_TICKET_VALUE_USD,
  );

  // calculate the ticket price
  const targetLotValueBTC = TARGET_LOT_VALUE_USD / BTCPriceInUSD;
  const ticketPriceWithoutCommissionInBTC =
    targetLotValueBTC / ticketsAvailable;
  const ticketPriceInBTC = numberToDigits(
    ticketPriceWithoutCommissionInBTC * (100 + TICKET_COMMISSION_PERCENTAGE),
    6,
  );

  // calculate the commission
  const ticketCommissionInBTC = numberToDigits(
    (ticketPriceInBTC * TICKET_COMMISSION_PERCENTAGE) / 100,
    6,
  );

  // create the store
  const lotId: LotId = moment().startOf('day').format('YYYY-MM-DD'); // the id is the day
  const store = makeStore({ name: lotId });
  const { id: storeId } = await createStore(store);

  // create the store wallet
  const mnemonic = createMnemonic();

  await createStoreWallet(storeId, {
    existingMnemonic: mnemonic,
    passphrase: process.env.STORE_WALLET_SECRET_KEY,
  });

  // save the mnemonic created above in case we need to retrieve it later
  const hash = encrypt(mnemonic, process.env.STORE_MNEMONIC_SECRET_KEY);
  await firebaseSaveStoreData(storeId, { hash });

  // create an invoice payment webhook
  const invoicePaymentReceivedWebhook = makeWebhook(
    ['InvoiceReceivedPayment'], // once the tx is broadcasted on the blockchain
    process.env.INVOICE_RECEIVED_PAYMENT_WEBHOOK_URL,
  );
  await createWebhook(storeId, invoicePaymentReceivedWebhook);

  // create an invoice settled webhook
  const invoiceSettledWebhook = makeWebhook(
    ['InvoiceSettled', 'InvoicePaymentSettled'], // once the tx is confirmed or manually settled, we'll receive this webhook
    process.env.INVOICE_SETTLED_WEBHOOK_URL,
  );
  await createWebhook(storeId, invoiceSettledWebhook);

  // create an invoice expiry webhook
  const invoiceExpiredWebhook = makeWebhook(
    ['InvoiceExpired', 'InvoiceInvalid'], // if invoice expires or manually marked as invalid
    process.env.INVOICE_EXPIRED_WEBHOOK_URL,
  );
  await createWebhook(storeId, invoiceExpiredWebhook);

  // create the lot
  const lot = makeLot({
    id: lotId,
    storeId,
    BTCPriceInUSD,
    ticketPriceInBTC,
    ticketCommissionInBTC,
    ticketsAvailable,
  });

  await firebaseCreateLot(lot);
};
