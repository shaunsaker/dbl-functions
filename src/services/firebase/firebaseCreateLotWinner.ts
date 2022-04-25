import { firebase } from './';
import { LotId } from '../../lots/models';
import { WinnerData } from '../../lots/data';

export const firebaseCreateLotWinner = (
  lotId: LotId,
  data: WinnerData,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('winners')
        .doc(data.uid)
        .set(data, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
