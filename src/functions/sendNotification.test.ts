import { makeUserProfileData } from '../store/userProfile/data';
import { getUuid } from '../utils/getUuid';
import { setupSendNotificationTest } from './sendNotification.testUtils';

describe('sendNotification', () => {
  it('returns an error if there is no user profile data', async () => {
    const uid = getUuid();
    const { response } = await setupSendNotificationTest({
      uid,
      userProfileData: null,
    });

    expect(response).toEqual({
      error: true,
      message: `user data missing for ${uid} fool.`,
    });
  });

  it('returns an error if there are no user fcm tokens', async () => {
    const uid = getUuid();
    const userProfileData = makeUserProfileData({
      // @ts-expect-error testing bad data
      fcmTokens: null,
    });
    const { response } = await setupSendNotificationTest({
      uid,
      userProfileData,
    });

    expect(response).toEqual({
      error: true,
      message: `user fcm tokens missing for ${uid} fool.`,
    });
  });

  it('sends notifications', async () => {
    const notification = {
      title: 'Yay',
      body: 'You won!',
    };
    const userProfileData = makeUserProfileData({
      fcmTokens: [getUuid(), getUuid()],
    });
    const { response, firebaseSendNotification } =
      await setupSendNotificationTest({ userProfileData, notification });

    expect(firebaseSendNotification).toHaveBeenCalledWith({
      ...notification,
      token: userProfileData.fcmTokens[0],
    });
    expect(firebaseSendNotification).toHaveBeenCalledWith({
      ...notification,
      token: userProfileData.fcmTokens[1],
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });
});
