import { firebase } from './';
import { LotId } from '../../store/lots/models';
import { LotWinner } from '../../store/winners/models';

export const firebaseCreateLotWinner = (
  lotId: LotId,
  data: LotWinner,
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
