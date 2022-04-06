import axios from 'axios';

export const getBlockchainHDWallet = async (name: string) => {
  return await axios.get(
    `${process.env.BLOCK_CYPHER_API}/wallets/hd/${name}?token=${process.env.BLOCK_CYPHER_TOKEN}`,
  );
};
