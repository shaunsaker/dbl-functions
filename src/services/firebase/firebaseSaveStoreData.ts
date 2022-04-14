import { firebase } from '.';
import { StoreData } from '../../stores/models';
import { BtcPayServerStoreId } from '../btcPayServer/models';

export const firebaseSaveStoreData = (
  storeId: BtcPayServerStoreId,
  data: StoreData,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('stores')
        .doc(storeId)
        .set(data, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
