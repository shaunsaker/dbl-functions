import { LotId } from '../lots/models';

export type UserId = string;

export type Username = string;

export interface UserProfileData {
  dateCreated: string;
  username: Username;
  email: string;
  hasCompletedOnboarding: boolean;
  fcmTokens: string[];
  winnings?: {
    [key: LotId]: {
      link: string;
      hasSeenLink: boolean;
    };
  };
}
