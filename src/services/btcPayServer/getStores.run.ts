import { getStores } from './getStores';

require('dotenv').config();

const doAsync = async () => {
  const data = await getStores();

  console.log(data);
};

doAsync();
