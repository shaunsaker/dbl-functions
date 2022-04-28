import { runBookKeeper } from '.';

const doAsync = async () => {
  try {
    await runBookKeeper();
  } catch (error) {
    console.log((error as Error).message);
  }
};

doAsync();
