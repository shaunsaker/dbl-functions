import { createBlockchainHDWallet } from '../../services/blockCypher/createBlockchainHDWallet';
import { createMnemonic } from '../../utils/createMnemonic';
import { createXPubFromMnemonic } from '../../utils/createXPubFromMnemonic';

export const createLotWallet = async (walletName: string) => {
  const mnemonic = createMnemonic();
  const xPub = createXPubFromMnemonic(mnemonic);
  const chains = [0, 1]; // one for the lot address and another for the user addresses
  const outputWallet = await createBlockchainHDWallet(walletName, xPub, chains);

  return {
    mnemonic,
    xPub,
    outputWallet,
  };
};
