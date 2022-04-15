import { UserId, Username } from '../userProfile/models';

export const PER_USER_TICKET_LIMIT = 250;

export const TICKET_TIMEOUT_MS = 1000 * 60 * 60; // 60 minutes

export const TARGET_LOT_VALUE_USD = 1000000;

export const TARGET_TICKET_VALUE_USD = 10;

export const TICKET_COMMISSION_PERCENTAGE = 10;

// FIXME: these types (except Ticket types) can be shared with the mobile app somehow
export type LotId = string;

export interface Lot {
  id: LotId; // it's not present when created but is present when fetched
  storeId: string;
  active: boolean; // only one lot is active at a time
  ticketPriceInBTC: number;
  BTCPriceInUSD: number;
  ticketCommissionInBTC: number;
  totalInBTC: number;
  confirmedTicketCount: number;
  ticketsAvailable: number;
  perUserTicketLimit: number;
  drawTime: string;
  lastCallTime: string;
  dateCreated: string;
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
  uid: UserId;
  price: number;
  status: TicketStatus;
  dateCreated: string;
  confirmedTime?: string; // only once the deposit has been received and confirmed
  expiredTime?: string; // only if expired
}
