import { firebase } from './';
import { LotId } from '../../store/lots/models';
import { UserId } from '../../store/userProfile/models';
import { TicketId, Ticket } from '../../store/tickets/models';

export const firebaseFetchTickets = async ({
  lotId,
  uid,
  ticketIds,
}: {
  lotId: LotId;
  uid?: UserId;
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
