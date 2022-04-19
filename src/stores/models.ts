import { UserId } from '../userProfile/models';

export interface StoreData {
  hash: {
    iv: string;
    content: string;
  };
  winnerUid: UserId;
}
