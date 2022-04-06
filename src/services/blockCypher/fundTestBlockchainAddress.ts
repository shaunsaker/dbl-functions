import axios from 'axios';
import { BlockchainAddress } from '../../models';
import { AddressKeychain } from './models';

export const fundTestBlockchainAddress = async (
  address: BlockchainAddress,
  amount: number,
): Promise<AddressKeychain> => {
  return await axios.post(
    `${process.env.BLOCK_CYPHER_API}/faucet?token=${process.env.BLOCK_CYPHER_TOKEN}`,
    {
      address,
      amount,
    },
  );
};
