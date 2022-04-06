import axios from 'axios';
import { AddressKeychain } from './models';

export const createBlockchainAddress = async (): Promise<AddressKeychain> => {
  return (
    await axios.post(`${process.env.BLOCK_CYPHER_API}/addrs`, {
      token: process.env.BLOCK_CYPHER_TOKEN,
    })
  ).data;
};
