import { firebase } from '.';
import { Lot, LotId } from '../../models';

export const firebaseUpdateLot = (
  lotId: LotId,
  data: Partial<Lot>,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase.firestore().collection('lots').doc(lotId).update(data);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
