import { firebase } from './';
import { StoreData } from '../../models';
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
      const lot = document.data() as StoreData;

      resolve(lot);
    } catch (error) {
      reject(error);
    }
  });
};