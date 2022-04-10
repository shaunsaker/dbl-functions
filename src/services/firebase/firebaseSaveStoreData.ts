import { firebase } from '.';
import { BtcPayServerStoreId } from '../btcPayServer/models';

export const firebaseSaveStoreData = (
  storeId: BtcPayServerStoreId,
  data: Record<string, any>,
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
