import { LotId, Ticket } from '../../lots/models';
import { firebase } from './';
import { firebaseWriteBatch } from './firebaseWriteBatch';

export const firebaseSaveTickets = async (
  lotId: LotId,
  tickets: Ticket[],
): Promise<void> => {
  const docs = tickets.map((ticket) => ({
    ref: firebase
      .firestore()
      .collection('lots')
      .doc(lotId)
      .collection('tickets')
      .doc(ticket.id),
    data: ticket,
  }));

  await firebaseWriteBatch(docs);
};
