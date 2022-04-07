import { firebase } from '.';
import { Hash, UserId } from '../../models';

export const firebaseSaveUserAddressHash = (
  uid: UserId,
  hash: Hash,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('userAddresses')
        .doc(uid)
        .set({ hash }, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
