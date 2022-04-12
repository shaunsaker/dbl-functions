import { createBlockchainAddress } from './createBlockchainAddress';

require('dotenv').config();

const doAsync = async () => {
  const addressKeychain = await createBlockchainAddress();
  console.log('OUTPUT', addressKeychain);
};

doAsync();
