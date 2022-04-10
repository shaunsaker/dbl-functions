export const PER_USER_TICKET_LIMIT = 250;

export const TICKET_TIMEOUT_MS = 3600000;

export const TARGET_LOT_VALUE_USD = 1000000;

export const TARGET_TICKET_VALUE_USD = 10;

export const TICKET_COMMISSION_PERCENTAGE = 10;

export const AVERAGE_TX_SIZE_BYTES = 250;

// FIXME: these types (except Ticket types) can be shared with the mobile app somehow
export type LotId = string;

export type StoreId = string;

export type Timestamp = string;

export type BlockchainAddress = string;

export interface Lot {
  id: LotId; // it's not present when created but is present when fetched
  storeId: StoreId;
  active: boolean; // only one lot is active at a time
  ticketPriceInBTC: number;
  BTCPriceInUSD: number;
  ticketCommissionInBTC: number;
  totalInBTC: number;
  confirmedTicketCount: number;
  ticketsAvailable: number;
  perUserTicketLimit: number;
  ticketTimeoutMs: number;
  drawTime: Timestamp;
  lastCallTime: Timestamp;
  dateCreated: Timestamp;
}

export type UserId = string;

export enum TicketStatus {
  reserved = 'reserved',
  unconfirmed = 'unconfirmed', // we can see it but it's pending confirmation
  confirmed = 'confirmed',
  timedOut = 'timedOut',
}

export type TicketId = string;

export interface Ticket {
  id: TicketId;
  uid: UserId;
  status: TicketStatus;
  address: BlockchainAddress; // the address the user should send their BTC to
  reservedTime: Timestamp;
  confirmedTime?: Timestamp; // only once the deposit has been received and confirmed
}

export interface TicketGroup {
  address: BlockchainAddress;
  unconfirmedBalance: number;
  confirmedBalance: number;
  uid: string;
  tickets: Ticket[];
}

export type Username = string;

export interface UserProfileData {
  dateJoined: Timestamp;
  username: Username;
  email: string;
  hasCompletedOnboarding: boolean;
}

export interface Hash {
  iv: string;
  content: string;
}

export interface UserLotAddress {
  address: BlockchainAddress;
  hash: Hash;
}
