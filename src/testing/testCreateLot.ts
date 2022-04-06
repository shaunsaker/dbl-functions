import { createLot } from '../functions/boss/createLot';

require('dotenv').config();

const doAsync = async () => {
  const response = await createLot();

  console.log(JSON.stringify({ response }, undefined, 2));
};

doAsync();
