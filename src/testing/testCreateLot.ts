import { createLot } from '../functions/boss/createLot';

require('dotenv').config();

const doAsync = async () => {
  await createLot();
};

doAsync();
