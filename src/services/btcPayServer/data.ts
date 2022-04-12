import moment = require('moment');
import { getUuid } from '../../utils/getUuid';
import {
  BtcPayServerInvoiceId,
  BtcPayServerInvoicePaymentEventData,
  BtcPayServerStoreId,
} from './models';

export const makeBtcPayServerInvoicePaymentEventData = ({
  storeId,
  invoiceId,
  value,
}: {
  storeId: BtcPayServerStoreId;
  invoiceId: BtcPayServerInvoiceId;
  value: string;
}): BtcPayServerInvoicePaymentEventData => {
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
