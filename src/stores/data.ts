import {
  BtcPayServerStore,
  BtcPayServerWebhook,
  BtcPayServerWebhookEvent,
} from '../services/btcPayServer/models';
import { getUuid } from '../utils/getUuid';

export const makeStore = ({
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

export const makeWebhook = (
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
