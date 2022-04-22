import { getUuid } from '../utils/getUuid';
import { createLot } from './createLot';

export const setupCreateLotTest = async ({
  lotExists = false,
  storeId = getUuid(),
}: {
  lotExists?: boolean;
  BTCPriceInUSD?: number;
  storeId?: string;
}) => {
  const firebaseFetchLot = jest.fn();
  const createStore = jest.fn();
  const createStoreWallet = jest.fn();
  const firebaseSaveStoreWalletKeyData = jest.fn();
  const createWebhook = jest.fn();
  const firebaseCreateLot = jest.fn();

  if (lotExists) {
    firebaseFetchLot.mockReturnValue(true);
  }

  if (storeId) {
    createStore.mockReturnValue({ id: storeId });
  }

  const dependencies = {
    firebaseFetchLot,
    createStore,
    createStoreWallet,
    firebaseSaveStoreWalletKeyData,
    createWebhook,
    firebaseCreateLot,
  };
  const response = await createLot(dependencies);

  return { response, dependencies };
};
