import { firebase } from './';
import { BtcPayServerStoreId } from '../btcPayServer/models';
import { LotId } from '../../store/lots/models';
import { LotStoreWalletKey } from '../../store/keys/models';

export const firebaseFetchLotStoreWalletKey = async ({
  lotId,
  storeId,
}: {
  lotId: LotId;
  storeId: BtcPayServerStoreId;
}): Promise<LotStoreWalletKey> => {
  return new Promise(async (resolve, reject) => {
    try {
      const document = await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('keys')
        .doc(storeId)
        .get();
      const store = document.data() as LotStoreWalletKey;

      resolve(store);
    } catch (error) {
      reject(error);
    }
  });
};
