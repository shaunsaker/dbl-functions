import { UserRecord } from 'firebase-functions/v1/auth';
import { firebase } from '.';

export const firebaseGetUser = async (uid: string): Promise<UserRecord> => {
  return firebase.auth().getUser(uid);
};
