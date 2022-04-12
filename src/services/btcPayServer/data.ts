import moment = require('moment');
import { getUuid } from '../../utils/getUuid';
import {
  BtcPayServerInvoiceId,
  BtcPayServerInvoiceReceivedPaymentEventData,
  BtcPayServerStoreId,
} from './models';

export const makeBtcPayServerInvoiceReceivedPaymentEventData = ({
  storeId,
  invoiceId,
  value,
}: {
  storeId: BtcPayServerStoreId;
  invoiceId: BtcPayServerInvoiceId;
  value: string;
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
      value,
      fee: '0.00',
      status: 'Processing',
      destination: '',
    },
  };
};
