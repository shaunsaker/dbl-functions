import { firebase } from '.';
import { LotId, UserId, UserLotAddress } from '../../models';

export const firebaseFetchUserLotAddress = (
  lotId: LotId,
  uid: UserId,
): Promise<UserLotAddress> => {
  return new Promise(async (resolve, reject) => {
    try {
      const document = await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('userAddresses')
        .doc(uid)
        .get();
      const userLotAddress = document.data() as UserLotAddress;

      resolve(userLotAddress);
    } catch (error) {
      reject(error);
    }
  });
};
