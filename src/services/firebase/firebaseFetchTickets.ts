import { firebase } from './';
import { LotId, Ticket, TicketId, TicketStatus } from '../../lots/models';
import { UserId } from '../../userProfile/models';

export const firebaseFetchTickets = async ({
  lotId,
  uid,
  ticketStatuses,
  ticketIds,
}: {
  lotId: LotId;
  uid?: UserId;
  ticketStatuses?: TicketStatus[];
  ticketIds?: TicketId[];
}): Promise<Ticket[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let ref: firebase.firestore.Query<firebase.firestore.DocumentData> =
        firebase
          .firestore()
          .collection('lots')
          .doc(lotId)
          .collection('tickets');

      if (uid) {
        ref = ref.where('uid', '==', uid);
      }

      if (ticketStatuses) {
        ref = ref.where('status', 'in', ticketStatuses);
      }

      if (ticketIds) {
        ref = ref.where(
          firebase.firestore.FieldPath.documentId(),
          'in',
          ticketIds,
        );
      }

      const tickets = (await ref.get()).docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Ticket),
      );

      resolve(tickets);
    } catch (error) {
      reject(error);
    }
  });
};
