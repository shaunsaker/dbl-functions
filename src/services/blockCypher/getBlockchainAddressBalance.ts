import axios from 'axios';
import { BlockchainAddress } from '../../models';

export const getBlockchainAddressBalance = async (
  address: BlockchainAddress,
) => {
  return await axios.get(
    `${process.env.BLOCK_CYPHER_API}/addrs/${address}/balance`,
  );
};
