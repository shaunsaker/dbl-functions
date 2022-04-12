import { firebaseFetchStoreData } from '../services/firebase/firebaseFetchStoreData';
import { decrypt } from '../utils/crypto';

require('dotenv').config();

const doAsync = async () => {
  const storeId = process.argv[2];

  const data = await firebaseFetchStoreData(storeId);

  const mnemonic = decrypt(data.hash, process.env.STORE_MNEMONIC_SECRET_KEY);

  console.log({ data, mnemonic });
};

doAsync();
