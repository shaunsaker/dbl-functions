import { firebase } from '.';
import { Invoice, InvoiceId } from '../../store/invoices/models';
import { LotId } from '../../store/lots/models';

export const firebaseUpdateInvoice = ({
  lotId,
  invoiceId,
  data,
}: {
  lotId: LotId;
  invoiceId: InvoiceId;
  data: Partial<Invoice>;
}): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('invoices')
        .doc(invoiceId)
        .set(data, { merge: true });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
