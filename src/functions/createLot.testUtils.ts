import { LotId } from '../lots/models';
import { getUuid } from '../utils/getUuid';
import { createLot } from './createLot';

export const setupCreateLotTest = async ({
  lotId = getUuid(),
  active = true,
  lotExists = false,
  storeId = getUuid(),
}: {
  lotId?: LotId;
  active?: boolean;
  lotExists?: boolean;
  BTCPriceInUSD?: number;
  storeId?: string;
}) => {
  const firebaseFetchLot = jest.fn();
  const createStore = jest.fn();
  const createStoreWallet = jest.fn();
  const firebaseCreateLotStoreWalletKey = jest.fn();
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
    firebaseCreateLotStoreWalletKey,
    createWebhook,
    firebaseCreateLot,
  };
  const response = await createLot({ lotId, active, dependencies });

  return { response, dependencies };
};
