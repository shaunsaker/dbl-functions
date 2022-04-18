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
import { sendEmail } from '../../services/mailer';
import { UserId, Username } from '../../userProfile/models';
import { numberToDigits } from '../../utils/numberToDigits';
import { selectRandomItemFromArray } from '../../utils/selectRandomItemFromArray';
import { createLot } from '../createLot';

const drawWinner = async (lotId: LotId): Promise<UserId | undefined> => {
  // fetch the lot's confirmed tickets
  const confirmedTickets = await firebaseFetchTickets({
    lotId,
    ticketStatuses: [TicketStatus.confirmed],
  });

  // here come's a new millionaire 🎉
  const winningTicket = selectRandomItemFromArray(confirmedTickets);

  return winningTicket?.uid;
};

const createWinnerPullPayment = async ({
  storeId,
  user: { uid, username },
  lot,
}: {
  storeId: BtcPayServerStoreId;
  user: {
    uid: UserId;
    username: Username;
  };
  lot: Lot;
}): Promise<BtcPayServerPullPayment> => {
  // create a pull payment and return the viewLink so that the user can withdraw their BTC
  const lotCommissionBTC = lot.totalInBTC * TICKET_COMMISSION_PERCENTAGE;
  const paymentAmountBTC = numberToDigits(lot.totalInBTC - lotCommissionBTC, 6);

  const pullPayment = await createPullPayment(storeId, {
    name: `${storeId}-${uid}`,
    description: `Congratulations ${username}! You're our lucky winner 🎉`,
    amount: paymentAmountBTC.toString(),
    currency: 'BTC',
    paymentMethods: ['BTC'],
  });

  return pullPayment;
};

const createAdminPullPayment = async ({
  storeId,
  lot,
}: {
  storeId: BtcPayServerStoreId;
  lot: Lot;
}): Promise<BtcPayServerPullPayment> => {
  const lotCommissionBTC = numberToDigits(
    lot.totalInBTC * TICKET_COMMISSION_PERCENTAGE,
    6,
  );

  const pullPayment = await createPullPayment(storeId, {
    name: `${storeId}-admin`,
    description: '',
    amount: lotCommissionBTC.toString(),
    currency: 'BTC',
    paymentMethods: ['BTC'],
  });

  return pullPayment;
};

type Response = FirebaseFunctionResponse<void>;

// boss handles drawing the winner, sending BTC and creating the next lot
export const runBoss = async (): Promise<Response> => {
  // get the active lot id (in the future there may be a few)
  const activeLot = await firebaseFetchActiveLot();

  if (!activeLot) {
    return {
      error: true,
      message: 'Oh shit son, no active lot!',
    };
  }

  // get the store
  const store = await getStoreByStoreName(activeLot.id);

  if (!store) {
    return {
      error: true,
      message: 'Oh shit son, no store!',
    };
  }

  // validate that activeLot.totalInBTC at least matches our wallet balance
  const storeWalletBalance = await getStoreWalletBalance(store.id);
  const isLotTotalValid =
    parseFloat(storeWalletBalance.confirmedBalance) >= activeLot.totalInBTC;

  if (!isLotTotalValid) {
    return {
      error: true,
      message: `Oh shit son, lot total of ${activeLot.totalInBTC} is less than store wallet balance of ${storeWalletBalance.confirmedBalance}!`,
    };
  }

  // draw the winner
  const userId = await drawWinner(activeLot.id);

  if (!userId) {
    return {
      error: true,
      message: 'Oh shit son, no one participated!',
    };
  }

  // fetch the username
  const userProfileData = await firebaseFetchUserProfile(userId);

  if (!userProfileData) {
    return {
      error: true,
      message: 'Oh shit son, no user data!',
    };
  }

  // send winner and commission BTC
  const winnerPullPayment = await createWinnerPullPayment({
    storeId: store.id,
    user: {
      uid: userId,
      username: userProfileData.username,
    },
    lot: activeLot,
  });

  // save the url to the user's data for in-app display
  await firebaseUpdateUserProfile(userId, {
    withdrawWinningsLink: winnerPullPayment.viewLink,
  });

  // notify the winner via email
  await sendEmail({
    to: userProfileData.email,
    subject: `${process.env.APP_NAME}: You just won ${winnerPullPayment.amount} BTC!`,
    text: `Hi ${userProfileData.username},\n\nCongratulations, you're our lucky winner 🎉\n\n You can get your BTC at: ${winnerPullPayment.viewLink}.\n\nLove from the ${process.env.APP_NAME} team 😍`,
  });

  // notify the users
  await firebaseSendNotification({
    topic: FirebaseMessagingTopics.winner,
    title: 'We have a new Winner 👑🎉',
    body: 'Open the app for more info 😎',
  });

  await createAdminPullPayment({
    storeId: store.id,
    lot: activeLot,
  });

  // mark active lot as inactive and save the winner username
  await firebaseUpdateLot(activeLot.id, {
    active: false,
    winnerUsername: userProfileData.username,
  });

  // create a new lot
  await createLot();

  return {
    error: false,
    message: 'Great Success!',
  };
};

export const boss = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Europe/Belfast') // any GMT+0200
  .onRun(async () => {
    return await runBoss();
  });
