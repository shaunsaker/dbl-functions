import { LotId } from '../lots/models';
import { TicketId } from '../tickets/models';
import { UserId } from '../userProfile/models';

export type InvoiceId = string;

export enum InvoiceStatus {
  reserved = 'Reserved',
  paymentReceived = 'Payment Received',
  confirmed = 'Confirmed',
  expired = 'Expired',
}

export interface Invoice {
  id: InvoiceId;
  lotId: LotId;
  uid: UserId;
  dateCreated: string;
  address: string;
  amountBTC: number;
  rate: number;
  expiry: string;
  ticketIds: TicketId[];
  status: InvoiceStatus;
}
