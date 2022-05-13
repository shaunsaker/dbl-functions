import { firebaseFetchUserProfile } from '../services/firebase/firebaseFetchUserProfile';
import { FirebaseFunctionResponse } from '../services/firebase/models';
import { sendEmail } from '../services/mailer';
import { UserId } from '../store/userProfile/models';

export const notifyUser = async (
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
    sendEmail: typeof sendEmail;
  } = {
    firebaseFetchUserProfile,
    sendEmail,
  },
): Promise<FirebaseFunctionResponse<void>> => {
  // fetch the user profile
  const userProfileData = await dependencies.firebaseFetchUserProfile(uid);

  if (!userProfileData) {
    const message = `user data missing for ${uid} fool.`;

    console.log(`notifyUser: ${message}`);

    return {
      error: true,
      message,
    };
  }

  if (!userProfileData.email) {
    const message = `user email missing for ${uid} fool.`;

    console.log(`notifyUser: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // send an email
  try {
    await dependencies.sendEmail({
      email: userProfileData.email,
      subject: notification.title,
      body: notification.body,
    });
  } catch (error) {
    const message = (error as Error).message;

    console.log(`notifyUser: ${message}`);
  }

  return {
    error: false,
    message: 'great success!',
  };
};
