import { createBlockchainHDWalletAddress } from '../../services/blockCypher/createBlockchainHDWalletAddress';

export const LOT_ADDRESS_CHAIN_INDEX = 0;

export const createLotAddress = async (walletName: string) => {
  // we create the lot address at the 0 chain index of the wallet
  const HDWallet = await createBlockchainHDWalletAddress(
    walletName,
    LOT_ADDRESS_CHAIN_INDEX,
  );

  return HDWallet;
};
