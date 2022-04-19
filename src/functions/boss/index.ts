import * as functions from 'firebase-functions';
import {
  Lot,
  LotId,
  TicketStatus,
  TICKET_COMMISSION_PERCENTAGE,
} from '../../lots/models';
import { createPullPayment } from '../../services/btcPayServer/createPullPayment';
import { getStoreByStoreName } from '../../services/btcPayServer/getStoreByStoreName';
import { getStoreWalletBalance } from '../../services/btcPayServer/getStoreWalletBalance';
import {
  BtcPayServerPullPayment,
  BtcPayServerStoreId,
} from '../../services/btcPayServer/models';
import { firebaseFetchActiveLot } from '../../services/firebase/firebaseFetchActiveLot';
import { firebaseFetchTickets } from '../../services/firebase/firebaseFetchTickets';
import { firebaseFetchUserProfile } from '../../services/firebase/firebaseFetchUserProfile';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { firebaseUpdateUserProfile } from '../../services/firebase/firebaseUpdateUserProfile';
import {
  FirebaseFunctionResponse,
  FirebaseMessagingTopics,
} from '../../services/firebase/models';
import { firebaseSendNotification } from '../../services/firebase/firebaseSendNotification';
import { UserId, Username } from '../../userProfile/models';
import { selectRandomItemFromArray } from '../../utils/selectRandomItemFromArray';
import { createLot } from '../createLot';

export const drawWinner = async (
  lotId: LotId,
  dependencies: {
    firebaseFetchTickets: typeof firebaseFetchTickets;
  } = {
    firebaseFetchTickets,
  },
): Promise<UserId | undefined> => {
  // fetch the lot's confirmed tickets
  const confirmedTickets = await dependencies.firebaseFetchTickets({
    lotId,
    ticketStatuses: [TicketStatus.confirmed],
  });

  // here come's a new millionaire 🎉
  const winningTicket = selectRandomItemFromArray(confirmedTickets);

  return winningTicket?.uid;
};

export const getAdminPaymentAmountBTC = (lot: Lot): number => {
  const adminPaymentAmountBTC = lot.totalInBTC * TICKET_COMMISSION_PERCENTAGE;

  return adminPaymentAmountBTC;
};

export const getWinnerPaymentAmountBTC = (lot: Lot): number => {
  const adminPaymentAmountBTC = getAdminPaymentAmountBTC(lot);
  const paymentAmountBTC = lot.totalInBTC - adminPaymentAmountBTC;

  return paymentAmountBTC;
};

export const createWinnerPullPayment = async ({
  storeId,
  user: { uid, username },
  lot,
  dependencies = { createPullPayment },
}: {
  storeId: BtcPayServerStoreId;
  user: {
    uid: UserId;
    username: Username;
  };
  lot: Lot;
  dependencies?: { createPullPayment: typeof createPullPayment };
}): Promise<BtcPayServerPullPayment> => {
  // create a pull payment and return the viewLink so that the user can withdraw their BTC
  const paymentAmountBTC = getWinnerPaymentAmountBTC(lot);

  const pullPayment = await dependencies.createPullPayment(storeId, {
    name: `${storeId}-${uid}`,
    description: `Congratulations ${username}! You're our lucky winner 🎉`,
    amount: paymentAmountBTC.toString(),
    currency: 'BTC',
    paymentMethods: ['BTC'],
  });

  return pullPayment;
};

export const createAdminPullPayment = async ({
  storeId,
  lot,
  dependencies = { createPullPayment },
}: {
  storeId: BtcPayServerStoreId;
  lot: Lot;
  dependencies?: { createPullPayment: typeof createPullPayment };
}): Promise<BtcPayServerPullPayment> => {
  const adminPaymentAmountBTC = getAdminPaymentAmountBTC(lot);

  const pullPayment = await dependencies.createPullPayment(storeId, {
    name: `${storeId}-admin`,
    description: '',
    amount: adminPaymentAmountBTC.toString(),
    currency: 'BTC',
    paymentMethods: ['BTC'],
  });

  return pullPayment;
};

type Response = FirebaseFunctionResponse<void>;

// boss handles drawing the winner, sending BTC and creating the next lot
export const runBoss = async (
  dependencies: {
    firebaseFetchActiveLot: typeof firebaseFetchActiveLot;
    getStoreByStoreName: typeof getStoreByStoreName;
    getStoreWalletBalance: typeof getStoreWalletBalance;
    drawWinner: typeof drawWinner;
    firebaseFetchUserProfile: typeof firebaseFetchUserProfile;
    createWinnerPullPayment: typeof createWinnerPullPayment;
    firebaseUpdateUserProfile: typeof firebaseUpdateUserProfile;
    firebaseSendNotification: typeof firebaseSendNotification;
    createAdminPullPayment: typeof createAdminPullPayment;
    firebaseUpdateLot: typeof firebaseUpdateLot;
    createLot: typeof createLot;
  } = {
    firebaseFetchActiveLot,
    getStoreByStoreName,
    getStoreWalletBalance,
    drawWinner,
    firebaseFetchUserProfile,
    createWinnerPullPayment,
    firebaseUpdateUserProfile,
    firebaseSendNotification,
    createAdminPullPayment,
    firebaseUpdateLot,
    createLot,
  },
): Promise<Response> => {
  // get the active lot id (in the future there may be a few)
  const activeLot = await dependencies.firebaseFetchActiveLot();

  if (!activeLot) {
    return {
      error: true,
      message: 'Oh shit son, no active lot!',
    };
  }

  // get the store
  const store = await dependencies.getStoreByStoreName(activeLot.id);

  if (!store) {
    return {
      error: true,
      message: 'Oh shit son, no store!',
    };
  }

  // validate that activeLot.totalInBTC at least matches our wallet balance
  const storeWalletBalance = await dependencies.getStoreWalletBalance(store.id);
  const isLotTotalValid =
    parseFloat(storeWalletBalance.confirmedBalance) >= activeLot.totalInBTC;

  if (!isLotTotalValid) {
    return {
      error: true,
      message: 'Oh shit son, store wallet balance is less than the lot total!',
    };
  }

  // draw the winner
  const winnerUid = await dependencies.drawWinner(activeLot.id);

  if (!winnerUid) {
    return {
      error: true,
      message: 'Oh shit son, no one participated!',
    };
  }

  // fetch the username
  const userProfileData = await dependencies.firebaseFetchUserProfile(
    winnerUid,
  );

  // TODO: SS we need to log the winnerUid here for debugging and manual action (if necessary)

  if (!userProfileData) {
    return {
      error: true,
      message: 'Oh shit son, no user data!',
    };
  }

  // send winner and commission BTC
  const winnerPullPayment = await dependencies.createWinnerPullPayment({
    storeId: store.id,
    user: {
      uid: winnerUid,
      username: userProfileData.username,
    },
    lot: activeLot,
  });

  // save the url to the user's data for in-app display
  await dependencies.firebaseUpdateUserProfile(winnerUid, {
    winnerWithdrawalLink: winnerPullPayment.viewLink,
  });

  // notify the users
  await dependencies.firebaseSendNotification({
    topic: FirebaseMessagingTopics.winner,
    title: 'We have a new Winner 👑🎉',
    body: 'Open the app for more info 😎',
  });

  await dependencies.createAdminPullPayment({
    storeId: store.id,
    lot: activeLot,
  });

  // mark active lot as inactive and save the winner username
  await dependencies.firebaseUpdateLot(activeLot.id, {
    active: false,
    winnerUsername: userProfileData.username,
  });

  // create a new lot
  await dependencies.createLot();

  return {
    error: false,
    message: 'Great success!',
  };
};

export const boss = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Europe/Belfast') // any GMT+0200
  .onRun(async () => {
    return await runBoss();
  });
