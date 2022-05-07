import { firebase } from './';
import { LotId } from '../../store/lots/models';
import { BtcPayServerStoreId } from '../btcPayServer/models';
import { LotStoreWalletKey } from '../../store/keys/models';

export const firebaseCreateLotStoreWalletKey = ({
  lotId,
  storeId,
  data,
}: {
  lotId: LotId;
  storeId: BtcPayServerStoreId;
  data: Partial<LotStoreWalletKey>;
}): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('keys')
        .doc(storeId)
        .set(data, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
