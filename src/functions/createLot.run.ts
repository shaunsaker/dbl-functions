import { createLot } from './createLot';

const doAsync = async () => {
  await createLot();
};

doAsync();
