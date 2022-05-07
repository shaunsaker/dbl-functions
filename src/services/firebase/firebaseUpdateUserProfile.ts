import { firebase } from '.';
import { UserId, UserProfileData } from '../../store/userProfile/models';

export const firebaseUpdateUserProfile = (
  uid: UserId,
  data: Partial<UserProfileData>,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase.firestore().collection('users').doc(uid).update(data);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
