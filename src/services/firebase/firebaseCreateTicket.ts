import { firebase } from '.';
import { LotId, Ticket } from '../../models';

export const firebaseCreateTicket = (
  lotId: LotId,
  ticket: Omit<Ticket, 'id'>,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('tickets')
        .add(ticket);
    } catch (error) {
      reject(error);
    }
  });
};
