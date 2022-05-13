import { makeUserProfileData } from '../store/userProfile/data';
import { getUuid } from '../utils/getUuid';
import { setupNotifyUserTest } from './notifyUser.testUtils';

describe('notifyUser', () => {
  it('returns an error if there is no user profile data', async () => {
    const uid = getUuid();
    const { response } = await setupNotifyUserTest({
      uid,
      userProfileData: null,
    });

    expect(response).toEqual({
      error: true,
      message: `user data missing for ${uid} fool.`,
    });
  });

  it('returns an error if there is no user email', async () => {
    const uid = getUuid();
    const userProfileData = makeUserProfileData({
      // @ts-expect-error testing bad data
      email: null,
    });
    const { response } = await setupNotifyUserTest({
      uid,
      userProfileData,
    });

    expect(response).toEqual({
      error: true,
      message: `user email missing for ${uid} fool.`,
    });
  });

  it('sends notifications', async () => {
    const notification = {
      title: 'Yay',
      body: 'You won!',
    };
    const userProfileData = makeUserProfileData({});
    const { response, sendEmail } = await setupNotifyUserTest({
      userProfileData,
      notification,
    });

    expect(sendEmail).toHaveBeenCalledWith({
      email: userProfileData.email,
      subject: notification.title,
      body: notification.body,
    });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
    });
  });
});
