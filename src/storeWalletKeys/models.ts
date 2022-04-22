import { UserId } from '../userProfile/models';

export interface StoreWalletKeyData {
  hash: {
    iv: string;
    content: string;
  };
  winnerUid: UserId;
}
