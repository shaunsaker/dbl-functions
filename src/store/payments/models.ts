import { InvoiceId } from '../invoices/models';
import { LotId } from '../lots/models';
import { UserId } from '../userProfile/models';

export type PaymentId = string;

export interface Payment {
  id: PaymentId;
  uid: UserId;
  txId: string;
  lotId: LotId;
  invoiceId: InvoiceId;
  amountBTC: number;
  receivedDate: string;
  destination: string;
}
