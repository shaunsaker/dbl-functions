import { firebase } from '.';
import { InvoiceId } from '../../store/invoices/models';
import { LotId } from '../../store/lots/models';
import { Payment } from '../../store/payments/models';

export const firebaseCreatePayment = ({
  lotId,
  invoiceId,
  payment,
}: {
  lotId: LotId;
  invoiceId: InvoiceId;
  payment: Payment;
}): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('invoices')
        .doc(invoiceId)
        .collection('payments')
        .doc(payment.id)
        .set(payment);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
