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
  dateCreated: Timestamp;
}

export type UserId = string;

export enum TicketStatus {
  pendingDeposit = 'pendingDeposit',
  active = 'active',
  timeout = 'timeout',
}

export type TicketId = string;

export interface Ticket {
  id: TicketId;
  uid: UserId;
  status: TicketStatus;
  walletAddress: WalletAddress; // the address we're expecting the deposit from
  dateCreated: Timestamp;
  activatedTime?: Timestamp; // only once the deposit has been received and verified
}

export type Username = string;

export type WalletId = string;

export type WalletData = {
  id: WalletId;
  address: WalletAddress;
  preferred: boolean;
};

export type Wallets = Record<WalletId, WalletData>;

export interface UserProfileData {
  username: Username;
  email: string;
  hasCompletedOnboarding: boolean;
  wallets: Wallets;
}
