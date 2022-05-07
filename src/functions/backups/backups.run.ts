import { runBackups } from './';

const doAsync = async () => {
  try {
    await runBackups();
  } catch (error) {
    console.log((error as Error).message);
  }
};

doAsync();
