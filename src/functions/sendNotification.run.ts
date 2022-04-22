import { sendNotification } from './sendNotification';

const doAsync = async () => {
  const uid = process.argv[2];

  try {
    await sendNotification({
      uid,
      notification: { title: 'Test', body: 'Hello Gov!' },
    });
  } catch (error) {
    console.log('sendNotification.run: ', (error as Error).message);
  }
};

doAsync();
