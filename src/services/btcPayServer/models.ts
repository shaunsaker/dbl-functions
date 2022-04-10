export enum BtcPayServerEndpoint {
  stores = 'api/v1/stores',
}

export interface BtcPayServerStore {
  name: string;
  website: string;
  defaultPaymentMethod: 'BTC';
  speedPolicy: 'HighSpeed' | 'MediumSpeed' | 'LowSpeed' | 'LowMediumSpeed';
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
