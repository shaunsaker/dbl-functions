import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';
import { UserProfileData } from './models';

export const makeUserProfileData = ({
  dateCreated,
  username,
  email,
  hasCompletedOnboarding,
  fcmTokens,
  withdrawWinningsLink,
}: Partial<UserProfileData>): UserProfileData => {
  return {
    dateCreated: dateCreated || getTimeAsISOString(),
    username: username || '',
    email: email || '',
    hasCompletedOnboarding: hasCompletedOnboarding || true,
    fcmTokens: fcmTokens || [getUuid()],
    withdrawWinningsLink: withdrawWinningsLink || '',
  };
};
