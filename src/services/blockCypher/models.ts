export interface HDAddress {
  address: string;
  path: string;
  public: string;
}

export interface HDChains {
  index: 0;
  chain_addresses: HDAddress[];
}

export interface HDWallet {
  token: string;
  name: string;
  hd: true;
  extended_public_key: string;
  subchain_indexes: number[];
  chains: HDChains[];
}

export interface AddressKeychain {
  address: string;
  public: string;
  private: string;
  wif: string;
}

export interface WebhookEvent {
  id: string;
  event: 'tx-confirmation'; // there are others but we only use this one for now,
  hash: string;
  address: string;
  confirmations: number;
  confidence: number;
  // ...other unused fields
}
export interface Tx {
  hash: string;
  addresses: string[];
  total: number;
  fees: number;
  size: number;
  confirmations: number;
  // ...other unused fields
}

export interface TXSkeleton {
  tx: Tx;
  tosign: string[];
  signatures: string[];
  pubkeys: string[];
  tosign_tx: string[];
  // ...other unused fields
}

export interface AddressData {
  address: string;
  total_received: number;
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  // ...other unused fields
}
