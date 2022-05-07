import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { getUuid } from '../../utils/getUuid';
import { UserProfileData } from './models';

export const makeUserProfileData = ({
  dateCreated = getTimeAsISOString(),
  username = getUuid(),
  email = getUuid(),
  hasCompletedOnboarding = true,
  fcmTokens = [getUuid()],
}: Partial<UserProfileData>): UserProfileData => {
  return {
    dateCreated,
    username,
    email,
    hasCompletedOnboarding,
    fcmTokens,
  };
};
