import { firebase } from '.';
import { WinnerData } from '../../winners/models';
import { BtcPayServerStoreId } from '../btcPayServer/models';

export const firebaseSaveWinnerData = (
  storeId: BtcPayServerStoreId,
  data: Partial<WinnerData>,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('winners')
        .doc(storeId)
        .set(data, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
