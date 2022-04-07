import { firebase } from '.';
import { LotId, Ticket } from '../../models';

export const firebaseFetchReservedLotTickets = async (
  lotId: LotId,
): Promise<Ticket[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const tickets = (
        await firebase
          .firestore()
          .collection('lots')
          .doc(lotId)
          .collection('tickets')
          .where('status', '==', 'reserved')
          .get()
      ).docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));

      resolve(tickets);
    } catch (error) {
      reject(error);
    }
  });
};
