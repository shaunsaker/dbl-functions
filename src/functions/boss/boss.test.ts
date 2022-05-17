import {
  createAdminPullPayment,
  createWinnerPullPayment,
  drawWinner,
  getAdminPaymentAmountBTC,
  getWinnerPaymentAmountBTC,
} from '.';
import { makeLot } from '../../store/lots/data';
import { makeBtcPayServerPullPayment } from '../../services/btcPayServer/data';
import { makeBtcPayServerStore } from '../../services/btcPayServer/data';
import { makeUserProfileData } from '../../store/userProfile/data';
import { arrayFromNumber } from '../../utils/arrayFromNumber';
import { getUuid } from '../../utils/getUuid';
import { setupBossTest } from './boss.testUtils';
import { makeTicket } from '../../store/tickets/data';
import { makeInvoice } from '../../store/invoices/data';
import { blockHashToRandomNumber } from '../../utils/blockHashToRandomNumber';
import { floatToIndex } from '../../utils/floatToIndex';

describe('boss', () => {
  describe('drawWinner', () => {
    const firebaseFetchInvoices = jest.fn();
    const firebaseFetchTickets = jest.fn();
    const blockCypherGetBlockchain = jest.fn();

    it('selects a random ticket', async () => {
      const lotId = getUuid();

      firebaseFetchInvoices.mockReturnValue([makeInvoice({})]);

      const confirmedTickets = arrayFromNumber(100).map(() =>
        makeTicket({ uid: getUuid() }),
      );
      firebaseFetchTickets.mockReturnValue(confirmedTickets);

      const latestBlockHash =
        '0xacda89251071dce30f60ff41146f1a4d231acbab7ec76c072af04797198d2eed';
      blockCypherGetBlockchain.mockReturnValue({
        hash: latestBlockHash,
      });

      const { winnerUid, winningBlockHash } = await drawWinner(lotId, {
        firebaseFetchInvoices,
        firebaseFetchTickets,
        blockCypherGetBlockchain,
      });

      const randomNumber = blockHashToRandomNumber(latestBlockHash);
      const index = floatToIndex({
        float: randomNumber,
        count: confirmedTickets.length,
      });
      const winningTicket = confirmedTickets[index];
      expect(winnerUid).toEqual(winningTicket.uid);
      expect(latestBlockHash).toEqual(winningBlockHash);
    });
  });

  describe('createWinnerPullPayment', () => {
    const createPullPayment = jest.fn();

    it('creates a pull payment for the winner', async () => {
      const storeId = getUuid();
      const username = getUuid();
      const lot = makeLot({
        id: getUuid(),
        active: true,
        totalAvailableTickets: 100000,
      });
      await createWinnerPullPayment({
        storeId,
        username,
        lot,
        dependencies: { createPullPayment },
      });

      const paymentAmountBTC = getWinnerPaymentAmountBTC(lot);
      expect(createPullPayment).toHaveBeenCalledWith(storeId, {
        name: `${lot.id}-${username}`,
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
      const lot = makeLot({
        id: getUuid(),
        active: true,
        totalAvailableTickets: 100000,
      });
      await createAdminPullPayment({
        storeId,
        lot,
        dependencies: { createPullPayment },
      });

      const adminPaymentAmountBTC = getAdminPaymentAmountBTC(lot);
      expect(createPullPayment).toHaveBeenCalledWith(storeId, {
        name: `${lot.id}-admin`,
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
        message: 'oh shit son, no active lot!',
      });
    });

    it('returns an error if there is no store', async () => {
      const { response } = await setupBossTest({
        store: null,
      });

      expect(response).toEqual({
        error: true,
        message: 'oh shit son, no store!',
      });
    });

    it('returns an error if there is not enough BTC in the wallet', async () => {
      const lotTotalInBTC = 10;
      const lot = makeLot({
        id: getUuid(),
        active: true,
        totalAvailableTickets: 100000,
        totalBTC: lotTotalInBTC,
      });
      const walletBalanceBTC = 5; // less than the lot total
      const { response } = await setupBossTest({ lot, walletBalanceBTC });

      expect(response).toEqual({
        error: true,
        message:
          'oh shit son, store wallet balance is less than the lot total!',
      });
    });

    it('returns an error if there is no user data for the winner', async () => {
      const winnerUid = getUuid();
      const { response } = await setupBossTest({
        winnerUid,
        winnerUserProfileData: null,
      });

      expect(response).toEqual({
        error: true,
        message: `oh shit son, no user data for ${winnerUid}!`,
      });
    });

    it('does the nitty gritty when there were no participants', async () => {
      const lot = makeLot({
        id: getUuid(),
        active: true,
        totalAvailableTickets: 100000,
        totalBTC: 1,
      });
      const store = { ...makeBtcPayServerStore({}), id: getUuid() };
      const winnerUid = null; // no winner
      const { response, dependencies } = await setupBossTest({
        lot,
        store,
        walletBalanceBTC: 1.1, // more than lot total
        winnerUid,
      });

      expect(dependencies.firebaseFetchActiveLot).toHaveBeenCalled();
      expect(dependencies.getStoreByStoreName).toHaveBeenCalledWith(lot.id);
      expect(dependencies.getStoreWalletBalance).toHaveBeenCalledWith(store.id);
      expect(dependencies.drawWinner).toHaveBeenCalledWith(lot.id);
      expect(dependencies.firebaseFetchUserProfile).not.toHaveBeenCalled();
      expect(dependencies.firebaseCreateLotWinner).not.toHaveBeenCalled();
      expect(dependencies.createWinnerPullPayment).not.toHaveBeenCalled();
      expect(dependencies.createAdminPullPayment).not.toHaveBeenCalled();
      expect(dependencies.firebaseCreateLotWinner).not.toHaveBeenCalled();
      expect(dependencies.firebaseUpdateLot).toHaveBeenCalledWith(lot.id, {
        active: false,
        winnerUsername: '', // no winner, this should be empty
      });
      expect(dependencies.notifyUser).not.toHaveBeenCalled();
      expect(dependencies.createLot).toHaveBeenCalled();
      expect(dependencies.firebaseFetchStats).toHaveBeenCalled();
      expect(dependencies.firebaseUpdateStats).toHaveBeenCalledWith({
        resultsCount: 11,
      });
      expect(response).toEqual({
        error: false,
        message: 'great success!',
      });
    });

    it('does the nitty gritty when there were participants', async () => {
      const lot = makeLot({
        id: getUuid(),
        active: true,
        totalAvailableTickets: 100000,
        totalBTC: 1,
      });
      const store = { ...makeBtcPayServerStore({}), id: getUuid() };
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
      expect(dependencies.firebaseCreateLotWinner).toHaveBeenCalledWith(
        lot.id,
        {
          uid: winnerUid,
        },
      );
      expect(dependencies.createWinnerPullPayment).toHaveBeenCalledWith({
        storeId: store.id,
        username: winnerUserProfileData.username,
        lot,
      });
      expect(dependencies.createAdminPullPayment).toHaveBeenCalledWith({
        storeId: store.id,
        lot,
      });
      expect(dependencies.firebaseCreateLotWinner).toHaveBeenCalledWith(
        lot.id,
        {
          uid: winnerUid,
        },
      );
      expect(dependencies.firebaseUpdateLot).toHaveBeenCalledWith(lot.id, {
        active: false,
        winnerUsername: winnerUserProfileData.username,
        winningBlockHash: expect.any(String),
        latestBlockHashAtDrawTime: expect.any(String),
        winningTicketIndex: expect.any(Number),
      });

      expect(dependencies.firebaseUpdateUserProfile).toHaveBeenCalledWith(
        winnerUid,
        {
          winnings: {
            [lot.id]: { link: winnerPullPayment.viewLink, hasSeenLink: false },
          },
        },
      );
      expect(dependencies.notifyUser).toHaveBeenCalled();
      expect(dependencies.createLot).toHaveBeenCalled();
      expect(dependencies.firebaseFetchStats).toHaveBeenCalled();
      expect(dependencies.firebaseUpdateStats).toHaveBeenCalledWith({
        resultsCount: 11,
      });
      expect(response).toEqual({
        error: false,
        message: 'great success!',
      });
    });
  });
});
