import { firebase } from '.';
import { StoreWalletKeyData } from '../../storeWalletKeys/models';
import { BtcPayServerStoreId } from '../btcPayServer/models';

export const firebaseFetchStoreWalletKeyData = async (
  storeId: BtcPayServerStoreId,
): Promise<StoreWalletKeyData> => {
  return new Promise(async (resolve, reject) => {
    try {
      const document = await firebase
        .firestore()
        .collection('storeWalletKeys')
        .doc(storeId)
        .get();
      const store = document.data() as StoreWalletKeyData;

      resolve(store);
    } catch (error) {
      reject(error);
    }
  });
};
