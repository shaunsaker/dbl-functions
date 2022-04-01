import { firebase } from '.';
import { Lot } from '../../models';

export const firebaseFetchActiveLot = async (): Promise<Lot> => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeLots = (
        await firebase
          .firestore()
          .collection('lots')
          .where('active', '==', true)
          .get()
      ).docs.map((doc) => ({ id: doc.id, ...doc.data() } as Lot));

      // there should only be one active lot at a time
      const activeLot = activeLots[0];

      resolve(activeLot);
    } catch (error) {
      reject(error);
    }
  });
};
