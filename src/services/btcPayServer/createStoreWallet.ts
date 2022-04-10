import { btcPayServerApi } from '.';
import { BtcPayServerEndpoint, BtcPayServerStoreId } from './models';

type Payload = {
  existingMnemonic: string;
  passphrase: string;
  accountNumber?: number;
  savePrivateKeys?: boolean;
  importKeysToRPC?: boolean;
  wordList?: 'English';
  wordCount?: number;
  scriptPubKeyType?: 'Segwit';
};
type Response = void;

export const createStoreWallet = async (
  storeId: BtcPayServerStoreId,
  payload: Payload,
): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${BtcPayServerEndpoint.stores}/${storeId}/payment-methods/onchain/BTC/generate`;

    try {
      await btcPayServerApi.post<Response>(endpoint, payload);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
