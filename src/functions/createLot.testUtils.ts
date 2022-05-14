import { LotId } from '../store/lots/models';
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
  const blockCypherGetBlockchain = jest.fn();
  const firebaseCreateLot = jest.fn();

  if (lotExists) {
    firebaseFetchLot.mockReturnValue(true);
  }

  if (storeId) {
    createStore.mockReturnValue({ id: storeId });
  }

  blockCypherGetBlockchain.mockReturnValue({ height: 100000 });

  const dependencies = {
    firebaseFetchLot,
    createStore,
    createStoreWallet,
    firebaseCreateLotStoreWalletKey,
    createWebhook,
    blockCypherGetBlockchain,
    firebaseCreateLot,
  };
  const response = await createLot({ lotId, active, dependencies });

  return { response, dependencies };
};
