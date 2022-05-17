import { firebase } from '.';
import { StatsData } from '../../store/stats/models';

export const firebaseUpdateStats = (
  data: Partial<StatsData>,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase
        .firestore()
        .collection('stats')
        .doc('default')
        .update(data);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
