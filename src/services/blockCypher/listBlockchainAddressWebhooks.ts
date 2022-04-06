import axios from 'axios';

export const listBlockchainAddressWebhooks = async (): Promise<{
  id: string;
}> => {
  return await axios.get(
    `${process.env.BLOCK_CYPHER_API}/hooks?token=${process.env.BLOCK_CYPHER_TOKEN}`,
  );
};
