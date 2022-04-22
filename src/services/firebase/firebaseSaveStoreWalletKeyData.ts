import { firebase } from '.';
import { StoreWalletKeyData } from '../../storeWalletKeys/models';
import { BtcPayServerStoreId } from '../btcPayServer/models';

export const firebaseSaveStoreWalletKeyData = (
  storeId: BtcPayServerStoreId,
  data: Partial<StoreWalletKeyData>,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('storeWalletKeys')
        .doc(storeId)
        .set(data, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
