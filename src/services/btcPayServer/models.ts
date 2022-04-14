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
  | 'InvoiceSettled' // marked as settled
  | 'InvoiceInvalid' // marked as invalid
  | 'InvoicePaymentSettled';

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

export type BtcPayServerInvoiceId = string;

export interface BtcPayServerEventDataBase {
  deliveryId: string;
  webhookId: string;
  originalDeliveryId: string;
  isRedelivery: boolean;
  type: BtcPayServerWebhookEvent;
  timestamp: number;
  storeId: BtcPayServerStoreId;
  invoiceId: string;
}

export interface BtcPayServerInvoiceReceivedPaymentEventData
  extends BtcPayServerEventDataBase {
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

export type BtcPayServerInvoiceSettledEventData =
  BtcPayServerInvoiceReceivedPaymentEventData;

export interface BtcPayServerInvoiceExpiredEventData
  extends BtcPayServerEventDataBase {
  partiallyPaid: boolean;
}
