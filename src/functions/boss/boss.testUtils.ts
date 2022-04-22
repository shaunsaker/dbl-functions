import { runBoss } from '.';
import { makeLot } from '../../lots/data';
import { Lot } from '../../lots/models';
import { makeBtcPayServerPullPayment } from '../../services/btcPayServer/data';
import {
  BtcPayServerPullPayment,
  BtcPayServerStore,
} from '../../services/btcPayServer/models';
import { makeBtcPayServerStore } from '../../services/btcPayServer/data';
import { makeUserProfileData } from '../../userProfile/data';
import { UserId, UserProfileData } from '../../userProfile/models';
import { getUuid } from '../../utils/getUuid';

export const setupBossTest = async ({
  lot = makeLot({}),
  store = { ...makeBtcPayServerStore({}), id: getUuid() },
  walletBalanceBTC = 10,
  winnerUid = getUuid(),
  winnerUserProfileData = makeUserProfileData({}),
  winnerPullPayment = makeBtcPayServerPullPayment({}),
}: {
  lot?: Lot | null;
  store?: BtcPayServerStore | null;
  walletBalanceBTC?: number;
  winnerUid?: UserId;
  winnerUserProfileData?: UserProfileData | null;
  winnerPullPayment?: BtcPayServerPullPayment | null;
}) => {
  const firebaseFetchActiveLot = jest.fn();
  const getStoreByStoreName = jest.fn();
  const getStoreWalletBalance = jest.fn();
  const drawWinner = jest.fn();
  const firebaseFetchUserProfile = jest.fn();
  const firebaseSaveWinnerData = jest.fn();
  const createWinnerPullPayment = jest.fn();
  const firebaseUpdateUserProfile = jest.fn();
  const firebaseSendNotification = jest.fn();
  const createAdminPullPayment = jest.fn();
  const firebaseUpdateLot = jest.fn();
  const createLot = jest.fn();

  if (lot) {
    firebaseFetchActiveLot.mockReturnValue(lot);
  }

  if (store) {
    getStoreByStoreName.mockReturnValue(store);
  }

  if (walletBalanceBTC) {
    getStoreWalletBalance.mockReturnValue({
      // we only care about confirmedBalance
      confirmedBalance: walletBalanceBTC,
    });
  }

  if (winnerUid) {
    drawWinner.mockReturnValue(winnerUid);
  }

  if (winnerUserProfileData) {
    firebaseFetchUserProfile.mockReturnValue(winnerUserProfileData);
  }

  if (winnerPullPayment) {
    createWinnerPullPayment.mockReturnValue(winnerPullPayment);
  }

  const dependencies = {
    firebaseFetchActiveLot,
    getStoreByStoreName,
    getStoreWalletBalance,
    drawWinner,
    firebaseFetchUserProfile,
    firebaseSaveWinnerData,
    createWinnerPullPayment,
    firebaseUpdateUserProfile,
    firebaseSendNotification,
    createAdminPullPayment,
    firebaseUpdateLot,
    createLot,
  };
  const response = await runBoss(dependencies);

  return {
    response,
    dependencies,
  };
};
