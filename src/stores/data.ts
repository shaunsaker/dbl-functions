import {
  BtcPayServerStore,
  BtcPayServerWebhook,
  BtcPayServerWebhookEvent,
} from '../services/btcPayServer/models';
import { getUuid } from '../utils/getUuid';

// TODO: SS move this to BTCPayServer
// TODO: SS this is actually the store payload (id)
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
export const makeWebhook = ({
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
