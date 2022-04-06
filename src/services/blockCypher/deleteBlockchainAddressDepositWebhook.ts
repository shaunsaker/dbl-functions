import axios from 'axios';

export const deleteBlockchainAddressDepositWebhook = async (
  webhookId: string,
): Promise<void> => {
  await axios.delete(
    `${process.env.BLOCK_CYPHER_API}/hooks/${webhookId}?token=${process.env.BLOCK_CYPHER_TOKEN}`,
  );

  return;
};
