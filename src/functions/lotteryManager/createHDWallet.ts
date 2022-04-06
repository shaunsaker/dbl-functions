import { createBlockchainHDWallet } from '../../services/blockCypher/createBlockchainHDWallet';
import { createMnemonic } from '../../utils/createMnemonic';
import { createXPubFromMnemonic } from '../../utils/createXPubFromMnemonic';

export const createHDWallet = async (
  walletName: string,
  chainIndexes = [0],
) => {
  const mnemonic = createMnemonic();
  const xPub = createXPubFromMnemonic(mnemonic);
  const outputWallet = await createBlockchainHDWallet(
    walletName,
    xPub,
    chainIndexes,
  );

  return {
    mnemonic,
    xPub,
    outputWallet,
  };
};
