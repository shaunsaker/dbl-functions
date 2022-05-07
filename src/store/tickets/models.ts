import { InvoiceId } from '../invoices/models';
import { LotId } from '../lots/models';
import { UserId } from '../userProfile/models';

export enum TicketStatus {
  reserved = 'Reserved',
  paymentReceived = 'Payment Received',
  confirmed = 'Confirmed',
  expired = 'Expired',
}

export type TicketId = string;

export interface Ticket {
  id: TicketId;
  lotId: LotId;
  uid: UserId;
  priceBTC: number;
  status: TicketStatus;
  dateCreated: string;
  invoiceId: InvoiceId;
}
