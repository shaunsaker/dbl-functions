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

export enum BtcPayServerWebhookEvent {
  invoiceCreated = 'InvoiceCreated',
  invoiceReceivedPayment = 'InvoiceReceivedPayment',
  invoiceProcessing = 'InvoiceProcessing',
  invoiceExpired = 'InvoiceExpired',
  invoiceSettled = 'InvoiceSettled', // marked as settled
  invoiceInvalid = 'InvoiceInvalid', // marked as invalid
  invoicePaymentSettled = 'InvoicePaymentSettled',
}

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

export interface BtcPayServerTransactionPayload {
  destinations: {
    destination: string;
    amount: string;
    subtractFromAmount: boolean;
  }[];
  feeRate: number;
  proceedWithPayjoin?: boolean;
  proceedWithBroadcast?: boolean;
  noChange?: boolean;
  rbf?: boolean;
  selectedInputs?: string[];
}

export interface BtcPayServerTransaction {
  transactionHash: string;
  comment: string;
  amount: string;
  blockHash: string;
  blockHeight: string;
  confirmations: number;
  timestamp: number;
  status: string;
  labels: {
    [key: string]: {
      type: string;
      text: string;
    };
  };
}

export interface BtcPayServerPullPaymentPayload {
  name: string;
  description: string;
  amount: string;
  currency: 'BTC'; // NOTE: update this when we handle more coins/lightning
  period?: number;
  BOLT11Expiration?: string;
  startsAt?: number;
  expiresAt?: number;
  paymentMethods: ['BTC']; // NOTE: update this when we handle more coins/lightning
}

export interface BtcPayServerPullPayment {
  id: string;
  name: string;
  description: string;
  currency: string;
  amount: string;
  period: number;
  BOLT11Expiration: number;
  archived: boolean;
  viewLink: string;
}

export interface BtcPayServerInvoiceMetadata {
  orderId?: string;
  orderUrl?: string;
  uid: string;
  lotId: string;
  ticketIds: string[];
}

export interface BtcPayServerInvoicePayload {
  metadata: BtcPayServerInvoiceMetadata;
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
  amount: number; // corresponds to currency below, e.g. USD 5
  currency?: string;
  additionalSearchTerms?: string[];
}

export interface BtcPayServerInvoice
  extends Omit<BtcPayServerInvoicePayload, 'amount'> {
  id: BtcPayServerInvoiceId;
  storeId: BtcPayServerStoreId;
  amount: string; // corresponds to currency below, e.g. USD 5
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

export interface BtcPayServerStoreWalletBalance {
  balance: string;
  unconfirmedBalance: string;
  confirmedBalance: string;
}

export interface BtcPayServerPaymentMethod {
  destination: string;
  rate: string;
  amount: string;
  totalPaid: string;
  due: string;
  // ...other unused fields
}

export type BtcPayServerPaymentMethods = BtcPayServerPaymentMethod[];
