import { InvoiceId } from '../invoices/models';
import { LotId } from '../lots/models';
import { UserId } from '../userProfile/models';

export type TicketId = string;

export interface Ticket {
  id: TicketId;
  lotId: LotId;
  uid: UserId;
  priceBTC: number;
  dateCreated: string;
  invoiceId: InvoiceId;
}
