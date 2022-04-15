import { firebase } from '.';

export const sendNotification = async ({
  topic,
  title,
  body,
}: {
  topic: string;
  title: string;
  body: string;
}): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const payload = {
      notification: {
        title,
        body,
      },
      topic,
    };

    try {
      await firebase.messaging().send(payload);

      resolve();
    } catch (error) {
      reject(error);
    }

    return;
  });
};
