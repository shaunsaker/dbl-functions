import { firebase } from '.';
import { LotId } from '../../lots/models';
import { Ticket } from '../../tickets/models';

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

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
