import axios from 'axios';

export const createBlockchainHDWallet = async (
  name: string,
  xPub: string,
  chainIndexes?: number[],
) => {
  return (
    await axios.post(`${process.env.BLOCK_CYPHER_API}/wallets/hd`, {
      token: process.env.BLOCK_CYPHER_TOKEN,
      name,
      extended_public_key: xPub,
      subchain_indexes: chainIndexes,
    })
  ).data;
};
