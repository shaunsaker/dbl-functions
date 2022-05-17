import { firebase } from '.';
import { StatsData } from '../../store/stats/models';

export const firebaseFetchStats = (): Promise<StatsData> => {
  return new Promise(async (resolve, reject) => {
    try {
      const document = await firebase
        .firestore()
        .collection('stats')
        .doc('default')
        .get();
      const stats = document.data() as StatsData;

      resolve(stats);
    } catch (error) {
      reject(error);
    }
  });
};
