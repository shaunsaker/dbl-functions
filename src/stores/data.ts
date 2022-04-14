import { LotId, TicketId } from '../lots/models';
import {
  BtcPayServerStore,
  BtcPayServerWebhook,
  BtcPayServerWebhookEvent,
} from '../services/btcPayServer/models';
import { UserId } from '../userProfile/models';
import { getUuid } from '../utils/getUuid';
import { InvoicePayload } from './models';

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

export const makeInvoicePayload = ({
  amount,
  uid,
  lotId,
  ticketIds,
}: {
  amount: number;
  uid: UserId;
  lotId: LotId;
  ticketIds: TicketId[];
}): InvoicePayload => {
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
