import axios from 'axios';

export const getBlockchainHDWalletAddresses = async (name: string) => {
  return (
    await axios.get(
      `${process.env.BLOCK_CYPHER_API}/wallets/hd/${name}/addresses?token=${process.env.BLOCK_CYPHER_TOKEN}`,
    )
  ).data;
};
