import { runBoss } from '.';

const doAsync = async () => {
  try {
    await runBoss();
  } catch (error) {
    console.log((error as Error).message);
  }
};

doAsync();
