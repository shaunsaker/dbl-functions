import * as functions from 'firebase-functions';
import {
  Lot,
  LotId,
  MAX_BTC_DIGITS,
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
import { numberToDigits } from '../../utils/numberToDigits';
import { firebaseSaveStoreData } from '../../services/firebase/firebaseSaveStoreData';

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
  const adminPaymentAmountBTC = numberToDigits(
    (lot.totalInBTC * TICKET_COMMISSION_PERCENTAGE) / 100,
    MAX_BTC_DIGITS,
  );

  return adminPaymentAmountBTC;
};

export const getWinnerPaymentAmountBTC = (lot: Lot): number => {
  const adminPaymentAmountBTC = getAdminPaymentAmountBTC(lot);
  const paymentAmountBTC = numberToDigits(
    lot.totalInBTC - adminPaymentAmountBTC,
    MAX_BTC_DIGITS,
  );

  return paymentAmountBTC;
};

export const createWinnerPullPayment = async ({
  storeId,
  username,
  lot,
  dependencies = { createPullPayment },
}: {
  storeId: BtcPayServerStoreId;
  username: Username;
  lot: Lot;
  dependencies?: { createPullPayment: typeof createPullPayment };
}): Promise<BtcPayServerPullPayment> => {
  // create a pull payment and return the viewLink so that the user can withdraw their BTC
  const paymentAmountBTC = getWinnerPaymentAmountBTC(lot);

  const pullPayment = await dependencies.createPullPayment(storeId, {
    name: `${lot.id}-${username}`,
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
    name: `${lot.id}-admin`,
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
    firebaseSaveStoreData: typeof firebaseSaveStoreData;
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
    firebaseSaveStoreData,
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
    const message = 'oh shit son, no active lot!';

    console.log(`boss: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // get the store
  const store = await dependencies.getStoreByStoreName(activeLot.id);

  if (!store) {
    const message = 'oh shit son, no store!';

    console.log(`boss: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // validate that activeLot.totalInBTC at least matches our wallet balance
  const storeWalletBalance = await dependencies.getStoreWalletBalance(store.id);
  const isLotTotalValid =
    parseFloat(storeWalletBalance.confirmedBalance) >= activeLot.totalInBTC;

  if (!isLotTotalValid) {
    const message =
      'oh shit son, store wallet balance is less than the lot total!';

    console.log(`boss: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // draw the winner
  const winnerUid = await dependencies.drawWinner(activeLot.id);

  if (!winnerUid) {
    const message = 'oh shit son, no one participated 😢';

    console.log(`boss: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // fetch the username
  const userProfileData = await dependencies.firebaseFetchUserProfile(
    winnerUid,
  );

  if (!userProfileData) {
    const message = `oh shit son, no user data for ${winnerUid}!`;

    console.log(`boss: ${message}`);

    return {
      error: true,
      message,
    };
  }

  // save the winner's uid to the stores data (so that we don't expose it publicly)
  await dependencies.firebaseSaveStoreData(store.id, { winnerUid });

  // send winner and commission BTC
  const winnerPullPayment = await dependencies.createWinnerPullPayment({
    storeId: store.id,
    username: userProfileData.username,
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
    message: 'great success!',
  };
};

export const boss = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Europe/Belfast') // any GMT+0200
  .onRun(async () => {
    return await runBoss();
  });
