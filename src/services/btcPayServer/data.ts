import moment = require('moment');
import { getUuid } from '../../utils/getUuid';
import {
  BtcPayServerInvoiceExpiredEventData,
  BtcPayServerInvoiceId,
  BtcPayServerInvoicePayload,
  BtcPayServerInvoiceReceivedPaymentEventData,
  BtcPayServerInvoiceSettledEventData,
  BtcPayServerPullPayment,
  BtcPayServerStore,
  BtcPayServerStoreId,
  BtcPayServerWebhook,
  BtcPayServerWebhookEvent,
} from './models';

export const makeBtcPayServerInvoiceReceivedPaymentEventData = ({
  storeId,
  invoiceId,
  value,
}: {
  storeId: BtcPayServerStoreId;
  invoiceId: BtcPayServerInvoiceId;
  value: number;
}): BtcPayServerInvoiceReceivedPaymentEventData => {
  const deliveryId = getUuid();
  const now = moment().get('milliseconds');

  return {
    deliveryId: getUuid(),
    webhookId: getUuid(),
    originalDeliveryId: deliveryId,
    isRedelivery: false,
    type: BtcPayServerWebhookEvent.invoiceReceivedPayment,
    timestamp: now,
    storeId,
    invoiceId,
    afterExpiration: true,
    paymentMethod: 'BTC',
    payment: {
      id: getUuid(),
      receivedDate: now,
      value: value.toString(),
      fee: '0.00',
      status: 'Processing',
      destination: '',
    },
  };
};

export const makeBtcPayServerInvoiceSettledEventData = ({
  storeId,
  invoiceId,
  value,
}: {
  storeId: BtcPayServerStoreId;
  invoiceId: BtcPayServerInvoiceId;
  value: number;
}): BtcPayServerInvoiceSettledEventData => {
  return makeBtcPayServerInvoiceReceivedPaymentEventData({
    storeId,
    invoiceId,
    value,
  });
};

export const makeBtcPayServerInvoiceExpiredEventData = ({
  storeId,
  invoiceId,
}: {
  storeId: BtcPayServerStoreId;
  invoiceId: BtcPayServerInvoiceId;
}): BtcPayServerInvoiceExpiredEventData => {
  const deliveryId = getUuid();
  const now = moment().get('milliseconds');

  return {
    deliveryId: getUuid(),
    webhookId: getUuid(),
    originalDeliveryId: deliveryId,
    isRedelivery: false,
    type: BtcPayServerWebhookEvent.invoiceReceivedPayment,
    timestamp: now,
    storeId,
    invoiceId,
    partiallyPaid: false,
  };
};

export const makeBtcPayServerInvoicePayload = ({
  amount,
  uid,
  lotId,
  ticketIds,
}: {
  amount: number;
  uid: string;
  lotId: string;
  ticketIds: string[];
}): BtcPayServerInvoicePayload => {
  return {
    amount: amount || 0,
    checkout: {
      speedPolicy: 'LowSpeed',
    },
    metadata: {
      uid,
      lotId,
      ticketIds,
    },
  };
};

export const makeBtcPayServerPullPayment = ({
  id = getUuid(),
  name = getUuid(),
  description = getUuid(),
  currency = 'USD',
  amount = '10.00',
  period = 0,
  BOLT11Expiration = 0,
  archived = false,
  viewLink = getUuid(),
}: Partial<BtcPayServerPullPayment>): BtcPayServerPullPayment => {
  return {
    id,
    name,
    description,
    currency,
    amount,
    period,
    BOLT11Expiration,
    archived,
    viewLink,
  };
};

export const makeBtcPayServerStore = ({
  name = getUuid(),
}: Partial<BtcPayServerStore>): Omit<BtcPayServerStore, 'id'> => {
  return {
    name,
    website: '', // website is only for the BtcPayServer UI which we don't use
    defaultPaymentMethod: 'BTC',
    speedPolicy: 'LowSpeed', // 6 confirmations
    networkFeeMode: 'Never', // NOTE: if user's make multiple partial payments, fees will be higher when moving the funds
    monitoringExpiration: 60 * 60 * 2, // monitor for 2 hours (default is 1 hour which I have found not to be enough, at least on testnet)
  };
};

export const makeBtcPayServerWebhook = ({
  id = getUuid(),
  url,
  specificEvents,
  secret,
}: {
  id?: string;
  url: string;
  specificEvents: BtcPayServerWebhookEvent[];
  secret: string;
}): BtcPayServerWebhook => {
  return {
    id,
    url,
    authorizedEvents: {
      everything: false,
      specificEvents: specificEvents,
    },
    secret,
  };
};
