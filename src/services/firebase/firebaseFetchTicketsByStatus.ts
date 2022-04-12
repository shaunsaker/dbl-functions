import { firebase } from './';
import { LotId, Ticket, TicketId, TicketStatus } from '../../models';

export const firebaseFetchTicketsByStatus = async ({
  lotId,
  ticketIds,
  ticketStatus,
}: {
  lotId: LotId;
  ticketIds: TicketId[];
  ticketStatus: TicketStatus;
}): Promise<Ticket[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const tickets = (
        await firebase
          .firestore()
          .collection('lots')
          .doc(lotId)
          .collection('tickets')
          .where(firebase.firestore.FieldPath.documentId(), 'in', ticketIds)
          .where('status', '==', ticketStatus)
          .get()
      ).docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));

      resolve(tickets);
    } catch (error) {
      reject(error);
    }
  });
};
