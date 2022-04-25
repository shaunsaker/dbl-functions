import { InvoiceId } from '../invoices/models';
import { UserId, Username } from '../userProfile/models';

export const PER_USER_TICKET_LIMIT = 250;

export const TICKET_TIMEOUT_MINUTES = 60;

export const TARGET_LOT_VALUE_USD = 1000000;

export const TARGET_TICKET_VALUE_USD = 10;

export const TICKET_COMMISSION_PERCENTAGE = 10;

export const MAX_BTC_DIGITS = 8; // when rounded up, this is equivalent to $0.004 which is negligible

// FIXME: these types (except Ticket types) can be shared with the mobile app somehow
export type LotId = string;

export interface Lot {
  id: LotId; // it's not present when created but is present when fetched
  active: boolean; // only one lot is active at a time
  ticketPriceUSD: number;
  totalBTC: number;
  totalTickets: number;
  totalConfirmedTickets: number;
  totalAvailableTickets: number;
  perUserTicketLimit: number;
  dateCreated: string;
  lastCallTime: string;
  drawTime: string;
  winnerUsername?: Username;
}

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

export interface LotStoreWalletKey {
  hash: {
    iv: string;
    content: string;
  };
}
