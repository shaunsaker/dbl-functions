import * as functions from 'firebase-functions';
import * as moment from 'moment';
import {
  BlockchainAddress,
  Lot,
  LotId,
  Ticket,
  TicketGroup,
  TicketStatus,
} from '../../models';
import { getBlockchainAddressBalance } from '../../services/blockCypher/getBlockchainAddressBalance';
import { firebase } from '../../services/firebase';
import { firebaseFetchActiveLot } from '../../services/firebase/firebaseFetchActiveLot';
import { firebaseFetchReservedLotTickets } from '../../services/firebase/firebaseFetchReservedLotTickets';
import { firebaseFetchUserLotAddress } from '../../services/firebase/firebaseFetchUserLotAddress';
import { firebaseUpdateLot } from '../../services/firebase/firebaseUpdateLot';
import { firebaseWriteBatch } from '../../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
// import { testSendBTCFromTemporaryAddress } from '../../testing/utils/sendBTCFromTestAddress';
import { objectToArray } from '../../utils/objectToArray';
import { satoshiToBTC } from '../../utils/satoshiToBtc';
import { decrypt } from '../../utils/crypto';
import { createBlockchainTransaction } from '../../services/blockCypher/createBlockchainTransaction';
// import { BLOCK_CYPHER_TEST_FEE_BYTES } from '../../services/blockCypher/models';
import { btcToSatoshi } from '../../utils/btcToSatoshi';

const getTicketsGroupedByAddress = (tickets: Ticket[]): TicketGroup[] => {
  // then we need to group the tickets by address
  const ticketGroups: Record<BlockchainAddress, TicketGroup> = {};

  tickets.forEach((ticket) => {
    if (!ticketGroups[ticket.address]) {
      // create the ticket group
      const ticketGroup: TicketGroup = {
        address: ticket.address,
        unconfirmedBalance: 0,
        confirmedBalance: 0,
        uid: ticket.uid,
        tickets: [ticket],
      };

      ticketGroups[ticket.address] = ticketGroup;
    } else {
      // add the ticket
      ticketGroups[ticket.address].tickets.push(ticket);
    }
  });

  const ticketGroupsArray = objectToArray(ticketGroups);

  return ticketGroupsArray;
};

const getTicketGroupsWithBalances = async (
  ticketGroups: TicketGroup[],
): Promise<TicketGroup[]> => {
  // get all of the address balances
  const promises = ticketGroups.map((ticketGroup) => {
    return getBlockchainAddressBalance(ticketGroup.address);
  });

  const results = await Promise.all(promises);

  const addressesWithBalances = results.filter(
    (addressData) => addressData.balance,
  );

  // get the unconfirmed and confirmed balances
  const ticketGroupsWithBalances = addressesWithBalances.map((addressData) => {
    const ticketGroup = ticketGroups.find(
      (ticketGroup) => ticketGroup.address === addressData.address,
    ) as TicketGroup; // at this stage it has to be defined

    const newTicketGroup: TicketGroup = {
      ...ticketGroup,
      unconfirmedBalance: addressData.unconfirmed_balance,
      confirmedBalance: addressData.balance,
    };

    return newTicketGroup;
  });

  return ticketGroupsWithBalances;
};

const hasTicketTimedOut = (
  ticket: Ticket,
  ticketTimeoutMs: number,
): boolean => {
  const now = moment();

  // a ticket has timed out if the reservedTime + ticketTimeoutMs > now
  const ticketHasTimedOut = moment(ticket.reservedTime)
    .add({ milliseconds: ticketTimeoutMs })
    .isBefore(now);

  return ticketHasTimedOut;
};

const getTimedOutTickets = (
  ticketGroups: TicketGroup[],
  ticketTimeoutMs: number,
): Ticket[] => {
  const timedOutTickets: Ticket[] = [];

  ticketGroups.forEach((ticketGroup) => {
    const ticketGroupHasUnconfirmedBalance = ticketGroup.unconfirmedBalance;
    const ticketGroupHasConfirmedBalance = ticketGroup.confirmedBalance;

    // if the ticketGroup does not have a balance, check if we should mark it as timedOut
    if (!ticketGroupHasUnconfirmedBalance || !ticketGroupHasConfirmedBalance) {
      ticketGroup.tickets.forEach((ticket) => {
        if (hasTicketTimedOut(ticket, ticketTimeoutMs)) {
          timedOutTickets.push(ticket);
        }
      });
    }
  });

  return timedOutTickets;
};

const getConfirmedTickets = (
  ticketGroups: TicketGroup[],
  ticketPriceInBTC: number,
): Ticket[] => {
  const confirmedTickets: Ticket[] = [];

  ticketGroups.forEach((ticketGroup) => {
    const ticketGroupHasConfirmedBalance = ticketGroup.confirmedBalance;

    if (ticketGroupHasConfirmedBalance) {
      //  check the value of the ticketGroup and mark tickets as confirmed as appropriate
      let remainingBalance = satoshiToBTC(ticketGroupHasConfirmedBalance);

      ticketGroup.tickets.forEach((ticket) => {
        if (remainingBalance >= ticketPriceInBTC) {
          confirmedTickets.push(ticket);

          remainingBalance -= ticketPriceInBTC;
        }
      });
    }
  });

  return confirmedTickets;
};

const updateTicketsStatus = async ({
  lotId,
  tickets,
  status,
}: {
  lotId: LotId;
  tickets: Ticket[];
  status: TicketStatus;
}): Promise<void> => {
  const docs = tickets.map((ticket) => {
    const newTicket = {
      ...ticket,
      status,
    };

    return {
      ref: firebase
        .firestore()
        .collection('lots')
        .doc(lotId)
        .collection('tickets')
        .doc(ticket.id),
      data: newTicket,
    };
  });

  await firebaseWriteBatch(docs);
};

const updateLotStats = async (
  lot: Lot,
  confirmedTickets: Ticket[],
): Promise<void> => {
  const newConfirmedTicketCount =
    lot.confirmedTicketCount + confirmedTickets.length;

  // TODO: here we could verify that the balance of the address would match the new total
  const newTotalInBTC =
    lot.totalInBTC + confirmedTickets.length * lot.ticketPriceInBTC;

  const newTicketsAvailable = lot.ticketsAvailable - confirmedTickets.length;

  const newLotData: Partial<Lot> = {
    ...lot,
    confirmedTicketCount: newConfirmedTicketCount,
    totalInBTC: newTotalInBTC,
    ticketsAvailable: newTicketsAvailable,
  };

  await firebaseUpdateLot(lot.id, newLotData);
};

const sendAddressBalanceToLotAddress = async ({
  lot,
  ticketGroups,
}: {
  lot: Lot;
  ticketGroups: TicketGroup[];
}): Promise<void> => {
  for await (const ticketGroup of ticketGroups) {
    // get the private key of each ticketGroup address
    const userLotAddress = await firebaseFetchUserLotAddress(
      lot.id,
      ticketGroup.uid,
    );
    const privateKey = decrypt(
      userLotAddress.hash,
      process.env.USERS_ADDRESS_SECRET,
    );

    // send the BTC
    const valueInBTC = ticketGroup.tickets.length * lot.ticketPriceInBTC;
    const valueInSatoshi = btcToSatoshi(valueInBTC);

    const tx = await createBlockchainTransaction({
      inputAddress: userLotAddress.address,
      inputAddressPrivateKey: privateKey,
      outputAddress: lot.address,
      valueInSatoshi,
    });

    console.log(`Tx: https://live.blockcypher.com/bcy/tx/${tx.hash}`);
  }

  console.log(
    `Address: https://live.blockcypher.com/bcy/address/${lot.address}`,
  );
};

type Response = FirebaseFunctionResponse<void>;

export const runBagman = async (): Promise<Response> => {
  // fetch the active lot
  const activeLot = await firebaseFetchActiveLot();

  if (!activeLot) {
    return {
      error: true,
      message: 'No lot is currently active.',
      data: undefined,
    };
  }

  // fetch the tickets that have a status of reserved
  const tickets = await firebaseFetchReservedLotTickets(activeLot.id);

  // group the remaining tickets by address
  const ticketGroups = getTicketsGroupedByAddress(tickets);

  // TEMPORARY HELPER
  // if (ticketGroups.length) {
  //   await testSendBTCFromTemporaryAddress({
  //     outputAddress: ticketGroups[0].address,

  //     // we need the fee to forward it later
  //     BTCValue:
  //       ticketGroups[0].tickets.length *
  //       (activeLot.ticketPriceInBTC +
  //         satoshiToBTC(BLOCK_CYPHER_TEST_FEE_BYTES)),
  //   });
  // }

  // check each ticket group, check the balance of the address
  const ticketGroupsWithBalances = await getTicketGroupsWithBalances(
    ticketGroups,
  );

  // get the timed out tickets
  const timedOutTickets: Ticket[] = getTimedOutTickets(
    ticketGroupsWithBalances,
    activeLot.ticketTimeoutMs,
  );

  // set the timed out tickets status to timedOut
  await updateTicketsStatus({
    lotId: activeLot.id,
    tickets: timedOutTickets,
    status: TicketStatus.timedOut,
  });

  // get the confirmed tickets
  const confirmedTickets: Ticket[] = getConfirmedTickets(
    ticketGroupsWithBalances,
    activeLot.ticketPriceInBTC,
  );

  // group the confirmed tickets by address
  const groupedConfirmedTickets = getTicketsGroupedByAddress(confirmedTickets);

  // forward the BTC value of the ticket groups to the lot address
  await sendAddressBalanceToLotAddress({
    lot: activeLot,
    ticketGroups: groupedConfirmedTickets,
  });

  // set the confirmed tickets status to confirmed
  await updateTicketsStatus({
    lotId: activeLot.id,
    tickets: confirmedTickets,
    status: TicketStatus.confirmed,
  });

  // update the lot stats
  await updateLotStats(activeLot, confirmedTickets);

  return {
    error: false,
    message: 'Success',
    data: undefined,
  };
};

const bagman = functions.pubsub
  .schedule('every 5 minutes') // we can adjust this if necessary
  .onRun(async (): Promise<Response> => {
    return await runBagman();
  });

export { bagman };
