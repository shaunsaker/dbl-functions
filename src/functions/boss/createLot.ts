import moment = require('moment');
import {
  Lot,
  LotId,
  PER_USER_TICKET_LIMIT,
  TARGET_LOT_VALUE_USD,
  TARGET_TICKET_VALUE_USD,
  TICKET_COMMISSION_PERCENTAGE,
  TICKET_TIMEOUT_MS,
} from '../../models';
import { getBTCUSDPrice } from '../../services/binance/getBTCUSDPrice';
import { createStore } from '../../services/btcPayServer/createStore';
import { createStoreWallet } from '../../services/btcPayServer/createStoreWallet';
import { createWebhook } from '../../services/btcPayServer/createWebhook';
import {
  BtcPayServerStore,
  BtcPayServerStoreId,
  BtcPayServerWebhook,
  BtcPayServerWebhookEvent,
} from '../../services/btcPayServer/models';
import { firebaseCreateLot } from '../../services/firebase/firebaseCreateLot';
import { firebaseSaveStoreData } from '../../services/firebase/firebaseSaveStoreData';
import { createMnemonic } from '../../utils/createMnemonic';
import { encrypt } from '../../utils/crypto';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { getUuid } from '../../utils/getUuid';
import { numberToDigits } from '../../utils/numberToDigits';

const makeStore = ({
  name = '',
}: Partial<BtcPayServerStore>): Omit<BtcPayServerStore, 'id'> => {
  return {
    name,
    website: '', // website is only for the BtcPayServer UI which we don't use
    defaultPaymentMethod: 'BTC',
    speedPolicy: 'LowSpeed', // 6 confirmations
    networkFeeMode: 'MultiplePaymentsOnly',
  };
};

const makeWebhook = (
  specificEvents: BtcPayServerWebhookEvent[],
  url: string,
): BtcPayServerWebhook => {
  return {
    id: getUuid(),
    url,
    authorizedEvents: {
      everything: false,
      specificEvents: specificEvents,
    },
    secret: process.env.WEBHOOK_SECRET,
  };
};

const makeLot = ({
  id,
  storeId,
  ticketPriceInBTC,
  BTCPriceInUSD,
  ticketCommissionInBTC,
  ticketsAvailable,
}: {
  id: LotId;
  storeId: BtcPayServerStoreId;
  ticketPriceInBTC: number;
  BTCPriceInUSD: number;
  ticketCommissionInBTC: number;
  ticketsAvailable: number;
}): Lot => {
  const now = moment();
  const drawTime = now.clone().endOf('day').subtract({ minutes: 1 }); // 23h59 today
  const ticketTimeoutMs = TICKET_TIMEOUT_MS;
  const lastCallTime = drawTime
    .clone()
    .subtract({ milliseconds: ticketTimeoutMs });

  return {
    id,
    storeId,
    dateCreated: getTimeAsISOString(now),
    lastCallTime: getTimeAsISOString(lastCallTime),
    drawTime: getTimeAsISOString(drawTime),
    active: true,
    totalInBTC: 0,
    confirmedTicketCount: 0,
    perUserTicketLimit: PER_USER_TICKET_LIMIT,
    ticketPriceInBTC,
    BTCPriceInUSD,
    ticketCommissionInBTC,
    ticketsAvailable,
  };
};

export const createLot = async (): Promise<void> => {
  // fetch the btc price in usd
  const BTCPriceInUSD = await getBTCUSDPrice();

  // // calculate the amount of tickets available
  const ticketsAvailable = Math.ceil(
    TARGET_LOT_VALUE_USD / TARGET_TICKET_VALUE_USD,
  );

  // calculate the ticket price
  const targetLotValueBTC = TARGET_LOT_VALUE_USD / BTCPriceInUSD;
  const ticketPriceInBTC = numberToDigits(
    targetLotValueBTC / ticketsAvailable,
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
  const invoicePaidWebhook = makeWebhook(
    ['InvoiceSettled', 'InvoicePaymentSettled'], // once the tx is confirmed or manually settled, we'll receive this webhook
    process.env.INVOICE_PAYMENT_WEBHOOK_URL,
  );
  await createWebhook(storeId, invoicePaidWebhook);

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
