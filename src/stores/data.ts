import {
  BtcPayServerStore,
  BtcPayServerWebhook,
  BtcPayServerWebhookEvent,
} from '../services/btcPayServer/models';
import { getUuid } from '../utils/getUuid';

// TODO: SS move this to BTCPayServer
export const makeStore = ({
  name = getUuid(),
}: Partial<BtcPayServerStore>): Omit<BtcPayServerStore, 'id'> => {
  return {
    name,
    website: '', // website is only for the BtcPayServer UI which we don't use
    defaultPaymentMethod: 'BTC',
    speedPolicy: 'LowSpeed', // 6 confirmations
    networkFeeMode: 'MultiplePaymentsOnly',
  };
};

// TODO: SS move this to BTCPayServer
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
