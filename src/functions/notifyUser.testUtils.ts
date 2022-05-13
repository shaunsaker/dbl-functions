import { makeUserProfileData } from '../store/userProfile/data';
import { UserId, UserProfileData } from '../store/userProfile/models';
import { getUuid } from '../utils/getUuid';
import { notifyUser } from './notifyUser';

export const setupNotifyUserTest = async ({
  userProfileData = makeUserProfileData({}),
  uid = getUuid(),
  notification = {
    title: '',
    body: '',
  },
}: {
  userProfileData?: UserProfileData | null;
  uid?: UserId;
  notification?: {
    title: string;
    body: string;
  };
}) => {
  const firebaseFetchUserProfile = jest.fn();
  const sendEmail = jest.fn();

  if (userProfileData) {
    firebaseFetchUserProfile.mockReturnValue(userProfileData);
  }

  const response = await notifyUser(
    { uid, notification },
    {
      firebaseFetchUserProfile,
      sendEmail,
    },
  );

  return { response, sendEmail };
};
