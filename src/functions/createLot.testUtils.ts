import { getUuid } from '../utils/getUuid';
import { createLot } from './createLot';

export const setupCreateLotTest = async ({
  BTCPriceInUSD = 50000,
  storeId = getUuid(),
}: {
  BTCPriceInUSD?: number;
  storeId?: string;
}) => {
  const getBTCUSDPrice = jest.fn();
  const createStore = jest.fn();
  const createStoreWallet = jest.fn();
  const firebaseSaveStoreData = jest.fn();
  const createWebhook = jest.fn();
  const firebaseCreateLot = jest.fn();

  if (BTCPriceInUSD) {
    getBTCUSDPrice.mockReturnValue(BTCPriceInUSD);
  }

  if (storeId) {
    createStore.mockReturnValue({ id: storeId });
  }

  const dependencies = {
    getBTCUSDPrice,
    createStore,
    createStoreWallet,
    firebaseSaveStoreData,
    createWebhook,
    firebaseCreateLot,
  };
  const response = await createLot(dependencies);

  return { response, dependencies };
};
