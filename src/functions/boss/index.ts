import * as functions from 'firebase-functions';
import {
  Lot,
  LotId,
  MAX_BTC_DIGITS,
  TICKET_COMMISSION_PERCENTAGE,
} from '../../store/lots/models';
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
import {
  FirebaseFunctionResponse,
  FirebaseMessagingTopics,
} from '../../services/firebase/models';
import { firebaseSendNotification } from '../../services/firebase/firebaseSendNotification';
import { UserId, Username } from '../../store/userProfile/models';
import { selectRandomItemFromArray } from '../../utils/selectRandomItemFromArray';
import { createLot } from '../createLot';
import { numberToDigits } from '../../utils/numberToDigits';
import { firebaseCreateLotWinner } from '../../services/firebase/firebaseCreateLotWinner';
import moment = require('moment');
import { getLotIdFromDate } from '../../utils/getLotIdFromDate';
import { firebaseUpdateUserProfile } from '../../services/firebase/firebaseUpdateUserProfile';
import { LotWinner } from '../../store/winners/models';
import { Ticket } from '../../store/tickets/models';
import { firebaseFetchInvoices } from '../../services/firebase/firebaseFetchInvoices';
import { InvoiceStatus } from '../../store/invoices/models';

export const drawWinner = async (
  lotId: LotId,
  dependencies: {
    firebaseFetchInvoices: typeof firebaseFetchInvoices;
    firebaseFetchTickets: typeof firebaseFetchTickets;
  } = {
    firebaseFetchInvoices,
    firebaseFetchTickets,
  },
): Promise<UserId | undefined> => {
  // fetch the lot's confirmed invoices
  const confirmedInvoices = await dependencies.firebaseFetchInvoices({
    lotId,
    status: InvoiceStatus.confirmed,
  });

  // for each invoice, fetch the invoice's tickets
  let confirmedTickets: Ticket[] = [];

  for await (const invoice of confirmedInvoices) {
    const tickets = await dependencies.firebaseFetchTickets({
      lotId,
      ticketIds: invoice.ticketIds,
    });

    confirmedTickets = [...confirmedTickets, ...tickets];
  }

  // here come's a new millionaire 🎉
  const winningTicket = selectRandomItemFromArray(confirmedTickets);

  return winningTicket?.uid;
};

export const getAdminPaymentAmountBTC = (lot: Lot): number => {
  const adminPaymentAmountBTC = numberToDigits(
    (lot.totalBTC * TICKET_COMMISSION_PERCENTAGE) / 100,
    MAX_BTC_DIGITS,
  );

  return adminPaymentAmountBTC;
};

export const getWinnerPaymentAmountBTC = (lot: Lot): number => {
  const adminPaymentAmountBTC = getAdminPaymentAmountBTC(lot);
  const paymentAmountBTC = numberToDigits(
    lot.totalBTC - adminPaymentAmountBTC,
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
    firebaseCreateLotWinner: typeof firebaseCreateLotWinner;
    createWinnerPullPayment: typeof createWinnerPullPayment;
    firebaseSendNotification: typeof firebaseSendNotification;
    createAdminPullPayment: typeof createAdminPullPayment;
    firebaseUpdateLot: typeof firebaseUpdateLot;
    createLot: typeof createLot;
    firebaseUpdateUserProfile: typeof firebaseUpdateUserProfile;
  } = {
    firebaseFetchActiveLot,
    getStoreByStoreName,
    getStoreWalletBalance,
    drawWinner,
    firebaseFetchUserProfile,
    firebaseCreateLotWinner,
    createWinnerPullPayment,
    firebaseSendNotification,
    createAdminPullPayment,
    firebaseUpdateLot,
    createLot,
    firebaseUpdateUserProfile,
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

  // validate that activeLot.totalBTC at least matches our wallet balance
  const storeWalletBalance = await dependencies.getStoreWalletBalance(store.id);
  const isLotTotalValid =
    parseFloat(storeWalletBalance.confirmedBalance) >= activeLot.totalBTC;

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
  const winnerUid = (await dependencies.drawWinner(activeLot.id)) || '';
  let winnerUsername = '';

  if (!winnerUid) {
    const message = 'oh shit son, no one participated 😢';

    console.log(`boss: ${message}`);
  } else {
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

    winnerUsername = userProfileData.username;

    // save the winner's uid to the lot
    // the alternative would be to save it to the lot but we don't want to expose the winner's uid publicly
    const lotWinner: LotWinner = {
      uid: winnerUid,
    };
    await dependencies.firebaseCreateLotWinner(activeLot.id, lotWinner);

    // send winner and commission BTC
    await dependencies.createAdminPullPayment({
      storeId: store.id,
      lot: activeLot,
    });

    const winnerPullPayment = await dependencies.createWinnerPullPayment({
      storeId: store.id,
      username: userProfileData.username,
      lot: activeLot,
    });

    // save the pull payment link to the user data
    const existingUserWinnings = userProfileData.winnings || {};
    existingUserWinnings[activeLot.id] = {
      link: winnerPullPayment.viewLink,
      hasSeenLink: false,
    };
    await dependencies.firebaseUpdateUserProfile(winnerUid, {
      winnings: existingUserWinnings,
    });
  }

  // mark active lot as inactive and save the winner username
  // NOTE: we need to do this here because we may not have had a winner
  // but we still want to mark the lot as inactive
  await dependencies.firebaseUpdateLot(activeLot.id, {
    active: false,
    winnerUsername,
  });

  // create a new lot
  const lotId = getLotIdFromDate(moment(activeLot.id).add({ days: 1 }));
  const active = true;
  await dependencies.createLot({ lotId, active });

  // notify the users
  await dependencies.firebaseSendNotification({
    topic: FirebaseMessagingTopics.winner,
    title: 'We have a new Winner 👑🎉',
    body: 'Open the app for more info 😎',
  });

  return {
    error: false,
    message: 'great success!',
  };
};

export const boss = functions
  .region('europe-west1')
  .pubsub.schedule('0 0 * * *') // every day at midnight
  .timeZone('Africa/Johannesburg')
  .onRun(async () => {
    return await runBoss();
  });
