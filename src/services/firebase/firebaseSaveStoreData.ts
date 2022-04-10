import { firebase } from '.';
import { StoreId } from '../../models';

export const firebaseSaveStoreData = (
  storeId: StoreId,
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
