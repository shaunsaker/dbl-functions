import { createLot } from './createLot';

const doAsync = async () => {
  try {
    await createLot();
  } catch (error) {
    console.log('createLot.run: ', (error as Error).message);
  }
};

doAsync();
