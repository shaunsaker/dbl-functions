import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';
import { UserProfileData } from './models';

export const makeUserProfileData = ({
  dateCreated,
  username,
  email,
  hasCompletedOnboarding,
  fcmTokens,
  winnerWithdrawalLink,
}: Partial<UserProfileData>): UserProfileData => {
  return {
    dateCreated: dateCreated || getTimeAsISOString(),
    username: username || getUuid(),
    email: email || getUuid(),
    hasCompletedOnboarding: hasCompletedOnboarding || true,
    fcmTokens: fcmTokens || [getUuid()],
    winnerWithdrawalLink: winnerWithdrawalLink || getUuid(),
  };
};
