import { firebase } from '.';
import { Lot } from '../../models';

export const firebaseCreateLot = (lot: Lot): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase.firestore().collection('lots').doc(lot.id).set(lot);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
