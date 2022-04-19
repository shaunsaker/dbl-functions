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

      if (ticketIds) {
        ref = ref.where(
          firebase.firestore.FieldPath.documentId(),
          'in',
          ticketIds,
        );
      }

      let tickets = (await ref.get()).docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Ticket),
      );

      // we're only allowed a single "in" per Firebase query
      // so we need to filter manually here
      if (ticketStatuses) {
        tickets = tickets.filter((ticket) =>
          ticketStatuses.includes(ticket.status),
        );
      }

      resolve(tickets);
    } catch (error) {
      reject(error);
    }
  });
};
