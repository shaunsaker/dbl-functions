// FIXME: these types (except Ticket types) can be shared with the mobile app somehow
export type LotId = string;

export type Timestamp = string;

export type WalletAddress = string;

export interface Lot {
  id: LotId;
  active: boolean; // only one lot is active at a time
  ticketPriceInBTC: number;
  BTCPriceInUSD: number;
  ticketCommissionInBTC: number;
  totalInBTC: number;
  ticketCount: number;
  ticketsLeft: number;
  perUserTicketLimit: number;
  ticketTimeout: number; // milliseconds
  drawTime: Timestamp;
  walletAddress: WalletAddress;
}

export type UserId = string;

export enum TicketStatus {
  pendingDeposit = 'pendingDeposit',
  active = 'active',
}

export type TicketId = string;

export interface Ticket {
  id: TicketId;
  uid: UserId;
  status: TicketStatus;
  reservedTime: Timestamp;
  activatedTime?: Timestamp; // only once the deposit has been received and verified
}
