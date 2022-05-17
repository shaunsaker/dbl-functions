import { Username } from '../userProfile/models';

export const PER_USER_TICKET_LIMIT = 250;

export const TICKET_TIMEOUT_MINUTES = 60;

export const TARGET_LOT_VALUE_USD = 1000000;

export const TARGET_TICKET_VALUE_USD = 10;

export const TICKET_COMMISSION_PERCENTAGE = 4.7;

export const MAX_BTC_DIGITS = 8; // when rounded up, this is equivalent to $0.004 which is negligible

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
  initialTicketIdBlockHeight: number; // set when the lot is created
  latestTicketIdBlockHeight: number; // updated with each ticket that is issued
  latestBlockHashAtDrawTime?: string;
  winnerUsername?: Username;
  winningBlockHash?: string;
  winningTicketIndex?: number;
}
