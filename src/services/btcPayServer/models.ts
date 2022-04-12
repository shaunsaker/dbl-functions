import { LotId, UserId } from '../../models';

export type BtcPayServerStoreId = string;

export enum BtcPayServerEndpoint {
  stores = 'api/v1/stores',
}

export type BtcPayServerSpeedPolicy =
  | 'HighSpeed'
  | 'MediumSpeed'
  | 'LowSpeed'
  | 'LowMediumSpeed';

export interface BtcPayServerStore {
  name: string;
  website: string;
  defaultPaymentMethod: 'BTC';
  speedPolicy: BtcPayServerSpeedPolicy;
  defaultCurrency?: 'USD';
  invoiceExpiration?: number;
  monitoringExpiration?: number;
  lightningDescriptionTemplate?: string;
  paymentTolerance?: number;
  anyoneCanCreateInvoice?: boolean;
  requiresRefundEmail?: boolean;
  lightningAmountInSatoshi?: boolean;
  lightningPrivateRouteHints?: boolean;
  onChainWithLnInvoiceFallback?: boolean;
  redirectAutomatically?: boolean;
  showRecommendedFee?: true;
  recommendedFeeBlockTarget?: number;
  defaultLang?: 'en';
  customLogo?: string;
  customCSS?: string;
  htmlTitle?: string;
  networkFeeMode?: 'MultiplePaymentsOnly' | 'Always' | 'Never';
  payJoinEnabled?: boolean;
  lazyPaymentMethods?: boolean;
  id: string; // returned in response
}

export type BtcPayServerWebhookId = string;

export type BtcPayServerWebhookEvent =
  | 'InvoiceCreated'
  | 'InvoiceReceivedPayment'
  | 'InvoiceProcessing'
  | 'InvoiceExpired'
  | 'InvoiceSettled'
  | 'InvoiceInvalid';

export interface BtcPayServerWebhook {
  id: BtcPayServerWebhookId;
  url: string;
  authorizedEvents: {
    everything?: boolean;
    specificEvents: string[];
  };
  secret: string;
  enabled?: boolean;
  automaticRedelivery?: boolean;
}

export interface BtcPayServerInvoicePayload {
  metadata: {
    orderId?: string;
    orderUrl?: string;
    lotId: LotId;
    uid: UserId;
  };
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

export type BtcPayServerInvoiceId = string;

export interface BtcPayServerInvoice
  extends Omit<BtcPayServerInvoicePayload, 'amount'> {
  id: BtcPayServerInvoiceId;
  storeId: BtcPayServerStoreId;
  amount: string;
  currency: string;
  type: string;
  checkoutLink: string;
  createdTime: number;
  expirationTime: number;
  monitoringTime: number;
  status: string;
  additionalStatus: string;
  availableStatusesForManualMarking: string[];
  archived: boolean;
}

export interface BtcPayServerInvoicePaymentEventData {
  deliveryId: string;
  webhookId: string;
  originalDeliveryId: string;
  isRedelivery: boolean;
  type: BtcPayServerWebhookEvent;
  timestamp: number;
  storeId: BtcPayServerStoreId;
  invoiceId: string;
  afterExpiration: boolean;
  paymentMethod: string;
  payment: {
    id: string;
    receivedDate: number;
    value: string;
    fee: string;
    status: 'Invalid' | 'Processing' | 'Settled';
    destination: string;
  };
}
