import { LotId, TicketId } from '../lots/models';
import {
  BtcPayServerInvoiceId,
  BtcPayServerSpeedPolicy,
  BtcPayServerStoreId,
} from '../services/btcPayServer/models';
import { UserId } from '../userProfile/models';

export interface InvoiceMetadata {
  orderId?: string;
  orderUrl?: string;
  uid: UserId;
  lotId: LotId;
  ticketIds: TicketId[];
}

export interface InvoicePayload {
  metadata: InvoiceMetadata;
  checkout: {
    speedPolicy: BtcPayServerSpeedPolicy;
    paymentMethods?: string; // defaults to all set in store
    defaultPaymentMethod?: 'BTC';
    expirationMinutes?: number;
    monitoringMinutes?: number;
    paymentTolerance?: number;
    redirectUrl?: string;
    redirectAutomatically?: boolean;
    requiresRefundEmail?: boolean;
    defaultLanguage?: 'en-US';
  };
  amount: number;
  currency?: string;
  additionalSearchTerms?: string[];
}

export interface Invoice extends Omit<InvoicePayload, 'amount'> {
  id: BtcPayServerInvoiceId;
  storeId: BtcPayServerStoreId;
  amount: string;
  currency: string;
  type: string;
  checkoutLink: string;
  dateCreated: number;
  expirationTime: number;
  monitoringTime: number;
  status: string;
  additionalStatus: string;
  availableStatusesForManualMarking: string[];
  archived: boolean;
}

export interface StoreData {
  hash: {
    iv: string;
    content: string;
  };
}
