import { firebase } from '.';
import { Invoice } from '../../invoices/models';
import { LotId } from '../../lots/models';

export const firebaseCreateInvoice = (
  lotId: LotId,
  invoice: Invoice,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('invoices')
        .doc(invoice.id)
        .set(invoice);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
