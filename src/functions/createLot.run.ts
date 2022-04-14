import { createLot } from './createLot';

require('dotenv').config();

const doAsync = async () => {
  await createLot();
};

doAsync();
