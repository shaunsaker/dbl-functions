import { firebase } from '.';
import { Lot, LotId } from '../../store/lots/models';

export const firebaseFetchLot = async (lotId: LotId): Promise<Lot> => {
  return new Promise(async (resolve, reject) => {
    try {
      const document = await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .get();
      const lot = document.data() as Lot;

      resolve(lot);
    } catch (error) {
      reject(error);
    }
  });
};
