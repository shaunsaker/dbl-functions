import { firebase } from '.';
import { UserId, UserProfileData } from '../../models';

export const firebaseFetchUserProfile = async (
  uid: UserId,
): Promise<UserProfileData> => {
  return new Promise(async (resolve, reject) => {
    try {
      const userProfileDocument = await firebase
        .firestore()
        .collection('users')
        .doc(uid)
        .get();
      const userProfileData = userProfileDocument.data() as UserProfileData;

      resolve(userProfileData);
    } catch (error) {
      reject(error);
    }
  });
};
