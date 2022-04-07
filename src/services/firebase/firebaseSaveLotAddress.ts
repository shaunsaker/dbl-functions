import { firebase } from '.';
import { Hash, LotId } from '../../models';

export const firebaseSaveLotAddress = (
  lotId: LotId,
  hash: Hash,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('lotAddresses')
        .doc(lotId)
        .set({ hash }, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
