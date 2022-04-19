import { getStores } from './getStores';

const doAsync = async () => {
  const data = await getStores();

  console.log(data);
};

doAsync();
