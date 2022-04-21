import { firebase } from '.';
import { StoreData } from '../../stores/models';
import { BtcPayServerStoreId } from '../btcPayServer/models';

export const firebaseFetchStoreData = async (
  storeId: BtcPayServerStoreId,
): Promise<StoreData> => {
  return new Promise(async (resolve, reject) => {
    try {
      const document = await firebase
        .firestore()
        .collection('stores')
        .doc(storeId)
        .get();
      const store = document.data() as StoreData;

      resolve(store);
    } catch (error) {
      reject(error);
    }
  });
};
