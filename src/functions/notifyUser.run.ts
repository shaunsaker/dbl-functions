import { notifyUser } from './notifyUser';

const doAsync = async () => {
  const uid = process.argv[2];

  try {
    await notifyUser({
      uid,
      notification: { title: 'Test', body: 'Hello Gov!' },
    });
  } catch (error) {
    console.log('notifyUser.run: ', (error as Error).message);
  }
};

doAsync();
