import { firebase } from '.';
import { LotId, Ticket, TicketStatus, UserId } from '../../models';

export const firebaseFetchReservedLotTickets = async ({
  lotId,
  uid,
}: {
  lotId: LotId;
  uid: UserId;
}): Promise<Ticket[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const tickets = (
        await firebase
          .firestore()
          .collection('lots')
          .doc(lotId)
          .collection('tickets')
          .where('uid', '==', uid)
          .where('status', '==', TicketStatus.reserved)
          .get()
      ).docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));

      resolve(tickets);
    } catch (error) {
      reject(error);
    }
  });
};
