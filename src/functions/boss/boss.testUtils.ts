import { runBoss } from '.';
import { makeLot } from '../../store/lots/data';
import { Lot } from '../../store/lots/models';
import { makeBtcPayServerPullPayment } from '../../services/btcPayServer/data';
import {
  BtcPayServerPullPayment,
  BtcPayServerStore,
} from '../../services/btcPayServer/models';
import { makeBtcPayServerStore } from '../../services/btcPayServer/data';
import { makeUserProfileData } from '../../store/userProfile/data';
import { UserId, UserProfileData } from '../../store/userProfile/models';
import { getUuid } from '../../utils/getUuid';

export const setupBossTest = async ({
  lot = makeLot({ id: getUuid(), active: true, totalAvailableTickets: 100000 }),
  store = { ...makeBtcPayServerStore({}), id: getUuid() },
  walletBalanceBTC = 10,
  winnerUid = getUuid(),
  winnerUserProfileData = makeUserProfileData({}),
  winnerPullPayment = makeBtcPayServerPullPayment({}),
}: {
  lot?: Lot | null;
  store?: BtcPayServerStore | null;
  walletBalanceBTC?: number;
  winnerUid?: UserId | null;
  winnerUserProfileData?: UserProfileData | null;
  winnerPullPayment?: BtcPayServerPullPayment | null;
}) => {
  const firebaseFetchActiveLot = jest.fn();
  const getStoreByStoreName = jest.fn();
  const getStoreWalletBalance = jest.fn();
  const drawWinner = jest.fn();
  const firebaseFetchUserProfile = jest.fn();
  const firebaseCreateLotWinner = jest.fn();
  const createWinnerPullPayment = jest.fn();
  const createAdminPullPayment = jest.fn();
  const firebaseUpdateLot = jest.fn();
  const createLot = jest.fn();
  const firebaseUpdateUserProfile = jest.fn();
  const notifyUser = jest.fn();

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
    drawWinner.mockReturnValue({
      winnerUid,
      winningBlockHash: '123456789',
      latestBlockHashAtDrawTime: '123456789',
      winningTicketIndex: 2,
    });
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
    firebaseCreateLotWinner,
    createWinnerPullPayment,
    createAdminPullPayment,
    firebaseUpdateLot,
    createLot,
    firebaseUpdateUserProfile,
    notifyUser,
  };
  const response = await runBoss(dependencies);

  return {
    response,
    dependencies,
  };
};
