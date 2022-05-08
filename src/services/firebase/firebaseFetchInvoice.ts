import { firebase } from '.';
import { Invoice, InvoiceId } from '../../store/invoices/models';
import { LotId } from '../../store/lots/models';

export const firebaseFetchInvoice = (
  lotId: LotId,
  invoiceId: InvoiceId,
): Promise<Invoice> => {
  return new Promise(async (resolve, reject) => {
    try {
      const invoice = (
        await firebase
          .firestore()
          .collection('lots')
          .doc(lotId)
          .collection('invoices')
          .doc(invoiceId)
          .get()
      ).data() as Invoice;

      resolve(invoice);
    } catch (error) {
      reject(error);
    }
  });
};
