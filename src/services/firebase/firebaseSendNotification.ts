import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import { firebase } from './';

export const firebaseSendNotification = async ({
  title,
  body,
  topic,
  token,
}: {
  title: string;
  body: string;
  topic?: string; // general group notifications
  token?: string; // specific user notifications
}): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const message: Message = {
      notification: {
        title,
        body,
      },
      // @ts-expect-error either topic or token should be defined
      topic,
      token,
    };

    try {
      await firebase.messaging().send(message);

      resolve();
    } catch (error) {
      reject(error);
    }

    return;
  });
};
