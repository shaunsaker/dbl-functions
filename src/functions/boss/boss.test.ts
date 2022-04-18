import {
  createAdminPullPayment,
  createWinnerPullPayment,
  drawWinner,
  getAdminPaymentAmountBTC,
  getWinnerPaymentAmountBTC,
} from '.';
import { makeLot, makeTicket } from '../../lots/data';
import { TicketStatus } from '../../lots/models';
import { makeBtcPayServerPullPayment } from '../../services/btcPayServer/data';
import { FirebaseMessagingTopics } from '../../services/firebase/models';
import { makeStore } from '../../stores/data';
import { makeUserProfileData } from '../../userProfile/data';
import { arrayFromNumber } from '../../utils/arrayFromNumber';
import { getUuid } from '../../utils/getUuid';
import { setupBossTest } from './boss.testUtils';

describe('boss', () => {
  describe('drawWinner', () => {
    const firebaseFetchTickets = jest.fn();

    it('selects a random ticket', async () => {
      const lotId = getUuid();

      firebaseFetchTickets.mockReturnValue(
        arrayFromNumber(100).map(() =>
          makeTicket({ status: TicketStatus.confirmed }),
        ),
      );

      const uid = await drawWinner(lotId, { firebaseFetchTickets });

      // we don't test randomness, leave that to selectRandomItemFromArray
      expect(uid).toBeTruthy();
    });
  });

  describe('createWinnerPullPayment', () => {
    const createPullPayment = jest.fn();

    it('creates a pull payment for the winner', async () => {
      const storeId = getUuid();
      const uid = getUuid();
      const username = getUuid();
      const lot = makeLot({});
      await createWinnerPullPayment({
        storeId,
        user: { uid, username },
        lot,
        dependencies: { createPullPayment },
      });

      const paymentAmountBTC = getWinnerPaymentAmountBTC(lot);
      expect(createPullPayment).toHaveBeenCalledWith(storeId, {
        name: `${storeId}-${uid}`,
        description: `Congratulations ${username}! You're our lucky winner 🎉`,
        amount: paymentAmountBTC.toString(),
        currency: 'BTC',
        paymentMethods: ['BTC'],
      });
    });
  });

  describe('createAdminPullPayment', () => {
    const createPullPayment = jest.fn();

    it('creates a pull payment for admin', async () => {
      const storeId = getUuid();
      const lot = makeLot({});
      await createAdminPullPayment({
        storeId,
        lot,
        dependencies: { createPullPayment },
      });

      const adminPaymentAmountBTC = getAdminPaymentAmountBTC(lot);
      expect(createPullPayment).toHaveBeenCalledWith(storeId, {
        name: `${storeId}-admin`,
        description: '',
        amount: adminPaymentAmountBTC.toString(),
        currency: 'BTC',
        paymentMethods: ['BTC'],
      });
    });
  });

  describe('runBoss', () => {
    it('returns an error if there is no active lot', async () => {
      const { response } = await setupBossTest({ lot: null });

      expect(response).toEqual({
        error: true,
        message: 'Oh shit son, no active lot!',
      });
    });

    it('returns an error if there is no store', async () => {
      const { response } = await setupBossTest({
        store: null,
      });

      expect(response).toEqual({
        error: true,
        message: 'Oh shit son, no store!',
      });
    });

    it('returns an error if there is not enough BTC in the wallet', async () => {
      const lotTotalInBTC = 10;
      const lot = makeLot({ totalInBTC: lotTotalInBTC });
      const walletBalanceBTC = 5; // less than the lot total
      const { response } = await setupBossTest({ lot, walletBalanceBTC });

      expect(response).toEqual({
        error: true,
        message:
          'Oh shit son, store wallet balance is less than the lot total!',
      });
    });

    it('returns an error if there are no participants', async () => {
      const { response } = await setupBossTest({ winnerUid: '' });

      expect(response).toEqual({
        error: true,
        message: 'Oh shit son, no one participated!',
      });
    });

    it('returns an error if there is no user data for the winner', async () => {
      const { response } = await setupBossTest({ winnerUserProfileData: null });

      expect(response).toEqual({
        error: true,
        message: 'Oh shit son, no user data!',
      });
    });

    it('does the nitty gritty', async () => {
      const lot = makeLot({ totalInBTC: 1 });
      const store = { ...makeStore({}), id: getUuid() };
      const winnerUid = getUuid();
      const winnerUserProfileData = makeUserProfileData({});
      const winnerPullPayment = makeBtcPayServerPullPayment({});
      const { response, dependencies } = await setupBossTest({
        lot,
        store,
        walletBalanceBTC: 1.1, // more than lot total
        winnerUid,
        winnerUserProfileData,
        winnerPullPayment,
      });

      expect(dependencies.firebaseFetchActiveLot).toHaveBeenCalled();
      expect(dependencies.getStoreByStoreName).toHaveBeenCalledWith(lot.id);
      expect(dependencies.getStoreWalletBalance).toHaveBeenCalledWith(store.id);
      expect(dependencies.drawWinner).toHaveBeenCalledWith(lot.id);
      expect(dependencies.firebaseFetchUserProfile).toHaveBeenCalledWith(
        winnerUid,
      );
      expect(dependencies.createWinnerPullPayment).toHaveBeenCalledWith({
        storeId: store.id,
        user: {
          uid: winnerUid,
          username: winnerUserProfileData.username,
        },
        lot,
      });
      expect(dependencies.firebaseUpdateUserProfile).toHaveBeenCalledWith(
        winnerUid,
        {
          winnerWithdrawalLink: winnerPullPayment.viewLink,
        },
      );
      expect(dependencies.firebaseSendNotification).toHaveBeenCalledWith({
        topic: FirebaseMessagingTopics.winner,
        title: 'We have a new Winner 👑🎉',
        body: 'Open the app for more info 😎',
      });
      expect(dependencies.createAdminPullPayment).toHaveBeenCalledWith({
        storeId: store.id,
        lot,
      });
      expect(dependencies.firebaseUpdateLot).toHaveBeenCalledWith(lot.id, {
        active: false,
        winnerUsername: winnerUserProfileData.username,
      });
      expect(dependencies.createLot).toHaveBeenCalled();
      expect(response).toEqual({
        error: false,
        message: 'Great Success!',
      });
    });
  });
});
