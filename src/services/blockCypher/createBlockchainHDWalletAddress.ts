import axios from 'axios';

export const createBlockchainHDWalletAddress = async (
  name: string,
  chainIndex: number,
) => {
  return (
    await axios.post(
      `${process.env.BLOCK_CYPHER_API}/wallets/hd/${name}/addresses/derive`,
      {
        token: process.env.BLOCK_CYPHER_TOKEN,
        subchain_index: chainIndex,
      },
    )
  ).data;
};
