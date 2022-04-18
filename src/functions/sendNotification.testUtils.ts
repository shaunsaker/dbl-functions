import { makeUserProfileData } from '../userProfile/data';
import { UserId, UserProfileData } from '../userProfile/models';
import { getUuid } from '../utils/getUuid';
import { sendNotification } from './sendNotification';

export const setupSendNotificationTest = async ({
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
  const firebaseSendNotification = jest.fn();

  if (userProfileData) {
    firebaseFetchUserProfile.mockReturnValue(userProfileData);
  }

  const response = await sendNotification(
    { uid, notification },
    {
      firebaseFetchUserProfile,
      firebaseSendNotification,
    },
  );

  return { response, firebaseSendNotification };
};
