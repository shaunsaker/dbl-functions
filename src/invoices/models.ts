import { TicketId } from '../lots/models';
import { UserId } from '../userProfile/models';

export type InvoiceId = string;

export interface Invoice {
  id: InvoiceId;
  uid: UserId;
  address: string;
  amountBTC: number;
  rate: number;
  expiry: string;
  ticketIds: TicketId[];
}
