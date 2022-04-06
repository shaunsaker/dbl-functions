import { createBlockchainHDWalletAddress } from '../../services/blockCypher/createBlockchainHDWalletAddress';

export const USERS_ADDRESS_CHAIN_INDEX = 1;

export const createUserAddress = async (walletName: string) => {
  // we create the users address at the 1 chain index of the wallet
  const HDWallet = await createBlockchainHDWalletAddress(
    walletName,
    USERS_ADDRESS_CHAIN_INDEX,
  );

  return HDWallet;
};
