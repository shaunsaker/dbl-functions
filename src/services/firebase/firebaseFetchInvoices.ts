import { firebase } from '.';
import { Invoice, InvoiceStatus } from '../../store/invoices/models';
import { LotId } from '../../store/lots/models';

export const firebaseFetchInvoices = ({
  lotId,
  status,
}: {
  lotId: LotId;
  status: InvoiceStatus;
}): Promise<Invoice[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const invoices = (
        await firebase
          .firestore()
          .collection('lots')
          .doc(lotId)
          .collection('invoices')
          .where('status', '==', status)
          .get()
      ).docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice));

      resolve(invoices);
    } catch (error) {
      reject(error);
    }
  });
};
