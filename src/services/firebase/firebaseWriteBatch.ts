import { firebase } from '.';

export const firebaseWriteBatch = async <T>(
  docs: { ref: firebase.firestore.DocumentReference<T>; data: T }[],
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const writeBatch = firebase.firestore().batch();

      docs.forEach((doc) => {
        writeBatch.set(doc.ref, doc.data, { merge: true });
      });

      await writeBatch.commit();

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
