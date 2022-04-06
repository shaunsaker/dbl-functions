import { firebase } from '.';
import { Hash, LotId } from '../../models';

export const firebaseSaveLotWalletHash = (
  lotId: LotId,
  hash: Hash,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('wallets')
        .doc(lotId)
        .set({ hash }, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
