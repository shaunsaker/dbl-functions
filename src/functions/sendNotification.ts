import { firebaseFetchUserProfile } from '../services/firebase/firebaseFetchUserProfile';
import { firebaseSendNotification } from '../services/firebase/firebaseSendNotification';
import { FirebaseFunctionResponse } from '../services/firebase/models';
import { UserId } from '../userProfile/models';

export const sendNotification = async (
  {
    uid,
    notification,
  }: {
    uid: UserId;
    notification: {
      title: string;
      body: string;
    };
  },
  dependencies: {
    firebaseFetchUserProfile: typeof firebaseFetchUserProfile;
    firebaseSendNotification: typeof firebaseSendNotification;
  } = {
    firebaseFetchUserProfile,
    firebaseSendNotification,
  },
): Promise<FirebaseFunctionResponse<void>> => {
  // fetch the user profile
  const userProfileData = await dependencies.firebaseFetchUserProfile(uid);

  if (!userProfileData) {
    return {
      error: true,
      message: 'User data missing fool.',
    };
  }

  // send notification(s)
  // NOTE: the user may have multiple devices/fcmToken's
  for await (const fcmToken of userProfileData.fcmTokens) {
    await dependencies.firebaseSendNotification({
      ...notification,
      token: fcmToken,
    });
  }

  return {
    error: false,
    message: 'Great success!',
  };
};
