import { firebase } from '.';
import { BlockchainAddress, Hash, LotId, UserId } from '../../models';

export const firebaseSaveUserLotAddress = ({
  lotId,
  uid,
  data,
}: {
  lotId: LotId;
  uid: UserId;
  data: {
    address: BlockchainAddress;
    hash: Hash;
  };
}): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('userAddresses')
        .doc(uid)
        .set(data, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
