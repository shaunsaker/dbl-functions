import * as functions from 'firebase-functions';
import * as moment from 'moment';
import {
  BlockchainAddress,
  LotId,
  Ticket,
  TicketGroup,
  TicketStatus,
} from '../../models';
import { getBlockchainAddressBalance } from '../../services/blockCypher/getBlockchainAddressBalance';
import { firebase } from '../../services/firebase';
import { firebaseFetchActiveLot } from '../../services/firebase/firebaseFetchActiveLot';
import { firebaseFetchReservedLotTickets } from '../../services/firebase/firebaseFetchReservedLotTickets';
import { firebaseWriteBatch } from '../../services/firebase/firebaseWriteBatch';
import { FirebaseFunctionResponse } from '../../services/firebase/models';
import { testSendBTCFromTemporaryAddress } from '../../testing/utils/sendBTCFromTestAddress';
import { objectToArray } from '../../utils/objectToArray';

const getTimedOutTickets = (
  ticketGroups: TicketGroup[],
  ticketTimeout: number,
): Ticket[] => {
  const now = moment();
  const timedOutTickets: Ticket[] = [];

  ticketGroups.forEach((ticketGroup) => {
    // if we have not received any BTC (unconfirmed or confirmed), we should time the ticket out
    if (!ticketGroup.unconfirmedBalance || !ticketGroup.confirmedBalance) {
      ticketGroup.tickets.forEach((ticket) => {
        // a ticket has timed out if the reservedTime + ticketTimeout > now
        const ticketHasTimedOut = moment(ticket.reservedTime)
          .add({ milliseconds: ticketTimeout })
          .isBefore(now);

        if (ticketHasTimedOut) {
          timedOutTickets.push(ticket);
        }
      });
    }
  });

  return timedOutTickets;
};

const makeTicketsTimedOut = async (
  timedOutTickets: Ticket[],
  lotId: LotId,
): Promise<void> => {
  const docs = timedOutTickets.map((ticket) => {
    const newTicket = {
      ...ticket,
      status: TicketStatus.timedOut,
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

const getReservedTicketGroups = (tickets: Ticket[]): TicketGroup[] => {
  // then we need to group the tickets by address
  const ticketGroups: Record<BlockchainAddress, TicketGroup> = {};

  tickets.forEach((ticket) => {
    if (!ticketGroups[ticket.address]) {
      // create the ticket group
      const ticketGroup: TicketGroup = {
        address: ticket.address,
        unconfirmedBalance: 0,
        confirmedBalance: 0,
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

  console.log({ activeLot });

  // fetch the tickets that have a status of reserved
  const tickets = await firebaseFetchReservedLotTickets(activeLot.id);

  console.log({ tickets });

  // group the remaining tickets by address
  const ticketGroups = getReservedTicketGroups(tickets);

  console.log({ ticketGroups });

  // TEMPORARY HELPER
  if (ticketGroups.length) {
    await testSendBTCFromTemporaryAddress({
      outputAddress: ticketGroups[0].address,
      BTCValue: activeLot.ticketPriceInBTC,
    });
  }

  // check each ticket group, check the balance of the address
  const ticketGroupsWithBalances = await getTicketGroupsWithBalances(
    ticketGroups,
  );

  console.log({ ticketGroupsWithBalances });

  // check if the tickets timed out, ie. they have no unconfirmed_balance
  // TODO: SS only time out when the unconfirmed_balance is not received in time
  const timedOutTickets = getTimedOutTickets(
    ticketGroups,
    activeLot.ticketTimeoutMs,
  );

  console.log({ timedOutTickets });

  // if the ticket timed out, set that status to timedOut
  await makeTicketsTimedOut(timedOutTickets, activeLot.id);
  // if a balance is not present, continue

  // else check the value of the ticket group

  // if it matches the address balance, mark all tickets status' as confirmed

  // otherwise, mark the value equivalent of the tickets as confirmed and leave the rest as reserved
  // (in case the user sends multiple transactions)

  // for all the newly confirmed tickets

  // update the lot confirmedTicketCount, totalInBTC and ticketsAvailable

  // and forward the BTC to the lot address

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
