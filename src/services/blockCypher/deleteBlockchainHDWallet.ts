import axios from 'axios';

export const deleteBlockchainHDWallet = async (name: string) => {
  return await axios.delete(
    `${process.env.BLOCK_CYPHER_API}/wallets/hd/${name}?token=${process.env.BLOCK_CYPHER_TOKEN}`,
  );
};
