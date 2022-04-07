import { runBagman } from '../functions/bagman';

require('dotenv').config();

const doAsync = async () => {
  const response = await runBagman();

  console.log(JSON.stringify({ response }, undefined, 2));
};

doAsync();
