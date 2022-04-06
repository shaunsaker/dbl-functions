import { createLot } from '../functions/lotteryManager/createLot';

require('dotenv').config();

const doAsync = async () => {
  const response = await createLot();

  console.log(JSON.stringify({ response }, undefined, 2));
};

doAsync();
