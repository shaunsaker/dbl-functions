import axios from 'axios';

export const createBlockchainAddressDepositWebhook = async (
  address: string,
): Promise<{ id: string }> => {
  return await axios.post(`${process.env.BLOCK_CYPHER_API}/hooks`, {
    token: process.env.BLOCK_CYPHER_TOKEN,
    address,
    event: 'tx-confirmation',
    url: process.env.DEPOSIT_CALLBACK_URL,
    signkey: process.env.WEBHOOK_SIGNING_KEY,
  });
};
