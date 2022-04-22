import { firebase } from '.';
import { LotId } from '../../lots/models';
import { WinnerData } from '../../winners/models';

export const firebaseSaveWinnerData = (
  lotId: LotId,
  data: Partial<WinnerData>,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('winners')
        .doc(lotId)
        .set(data, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
