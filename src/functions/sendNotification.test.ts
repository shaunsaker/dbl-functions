import { makeUserProfileData } from '../userProfile/data';
import { getUuid } from '../utils/getUuid';
import { setupSendNotificationTest } from './sendNotification.testUtils';

describe('sendNotification', () => {
  it('returns an error if there is no user profile data', async () => {
    const { response } = await setupSendNotificationTest({
      userProfileData: null,
    });

    expect(response).toEqual({
      error: true,
      message: 'User data missing fool.',
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
      message: 'Great success!',
    });
  });
});
