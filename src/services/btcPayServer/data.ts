import moment = require('moment');
import { getUuid } from '../../utils/getUuid';
import {
  BtcPayServerInvoiceExpiredEventData,
  BtcPayServerInvoiceId,
  BtcPayServerInvoiceReceivedPaymentEventData,
  BtcPayServerInvoiceSettledEventData,
  BtcPayServerStoreId,
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
    type: 'InvoiceReceivedPayment',
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
    type: 'InvoiceReceivedPayment',
    timestamp: now,
    storeId,
    invoiceId,
    partiallyPaid: false,
  };
};
