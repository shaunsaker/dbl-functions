import { LotId, Ticket } from '../models';
import { firebase } from '../services/firebase';
import { firebaseWriteBatch } from '../services/firebase/firebaseWriteBatch';

export const saveTickets = async (
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
