import { firebase } from '.';
import { InvoiceId } from '../../invoices/models';
import { LotId } from '../../lots/models';
import { Payment } from '../../payments/models';

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
