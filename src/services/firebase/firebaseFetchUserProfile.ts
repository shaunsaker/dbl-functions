import { firebase } from '.';
import { UserId, UserProfileData } from '../../userProfile/models';

export const firebaseFetchUserProfile = async (
  uid: UserId,
): Promise<UserProfileData> => {
  return new Promise(async (resolve, reject) => {
    try {
      const document = await firebase
        .firestore()
        .collection('users')
        .doc(uid)
        .get();
      const userProfileData = document.data() as UserProfileData;

      resolve(userProfileData);
    } catch (error) {
      reject(error);
    }
  });
};
