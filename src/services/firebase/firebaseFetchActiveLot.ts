import { firebase } from '.';
import { Lot } from '../../lots/models';

export const firebaseFetchActiveLot = async (): Promise<Lot> => {
  return new Promise(async (resolve, reject) => {
    try {
      const documents = await firebase
        .firestore()
        .collection('lots')
        .where('active', '==', true)
        .get();

      if (documents.docs.length > 1) {
        console.log('firebaseFetchActiveLot: multiple active lots fool.');
      }

      // for now there is only one
      const document = documents.docs[0];
      const lot = document.data() as Lot;

      resolve(lot);
    } catch (error) {
      reject(error);
    }
  });
};
