import {
  Lot,
  MAX_BTC_DIGITS,
  TICKET_COMMISSION_PERCENTAGE,
} from '../../store/lots/models';
import { Ticket, TicketStatus } from '../../store/tickets/models';
import { numberToDigits } from '../../utils/numberToDigits';

// NOTE: this covers a lot of scenarios and looks complicated, see tests for clarity
export const getLotStats = ({
  lot,
  ticketBefore,
  ticketAfter,
}: {
  lot: Lot;
  ticketBefore: Ticket | undefined;
  ticketAfter: Ticket | undefined;
}) => {
  let newTicketsAvailable = lot.totalAvailableTickets;
  let newConfirmedTicketCount = lot.totalConfirmedTickets;
  let newTotalInBTC = lot.totalBTC;

  const ticketWasAdded = !ticketBefore;
  const ticketWasDeleted = !ticketAfter;
  const ticketChanged = !ticketWasAdded && !ticketWasDeleted;

  if (ticketWasAdded) {
    // reserved ✅
    // paymentReceived ✅
    // confirmed ✅
    // expired ⛔
    const newTicketIsNotExpired = ticketAfter?.status !== TicketStatus.expired;
    const newTicketIsConfirmed = ticketAfter?.status === TicketStatus.confirmed;

    // if any ticket besides an expired one was added
    if (newTicketIsNotExpired) {
      newTicketsAvailable -= 1;

      // if a confirmed ticket was added also do the following
      if (newTicketIsConfirmed) {
        newConfirmedTicketCount += 1;
        newTotalInBTC += ticketAfter.priceBTC;
      }
    }
  } else if (ticketWasDeleted) {
    // reserved ✅
    // paymentReceived ✅
    // confirmed ✅
    // expired ⛔
    const ticketWasNotExpired = ticketBefore?.status !== TicketStatus.expired;
    const ticketWasConfirmed = ticketBefore?.status === TicketStatus.confirmed;

    if (ticketWasNotExpired) {
      newTicketsAvailable += 1;

      if (ticketWasConfirmed) {
        newConfirmedTicketCount -= 1;
        newTotalInBTC -= ticketBefore.priceBTC;
      }
    }
  } else if (ticketChanged) {
    // SUMMARY: we only act if:
    // a ticket became confirmed/expired
    // a ticket changed from confirmed/expired
    //
    // reserved => reserved ⛔
    // reserved => paymentReceived ⛔
    // reserved => confirmed ✅
    // reserved => expired ✅
    // paymentReceived => reserved ⛔
    // paymentReceived => paymentReceived ⛔
    // paymentReceived => confirmed ✅
    // paymentReceived => expired ✅
    // confirmed => reserved ✅
    // confirmed => paymentReceived ✅
    // confirmed => confirmed ⛔
    // confirmed => expired ✅
    // expired => reserved  ✅
    // expired => paymentReceived  ✅
    // expired => confirmed ✅
    // expired => expired ⛔

    const ticketWasConfirmed = ticketBefore.status === TicketStatus.confirmed;
    const ticketWasExpired = ticketBefore.status === TicketStatus.expired;
    const ticketIsConfirmed = ticketAfter.status === TicketStatus.confirmed;
    const ticketIsExpired = ticketAfter.status === TicketStatus.expired;
    const ticketBecameConfirmed = !ticketWasConfirmed && ticketIsConfirmed;
    const ticketBecameExpired =
      !ticketWasExpired && ticketAfter.status === TicketStatus.expired;

    if (ticketBecameConfirmed) {
      newConfirmedTicketCount += 1;
      newTotalInBTC += ticketAfter.priceBTC;

      if (ticketWasExpired) {
        newTicketsAvailable -= 1;
      }
    } else if (ticketBecameExpired) {
      newTicketsAvailable += 1;

      if (ticketWasConfirmed) {
        newConfirmedTicketCount -= 1;
        newTotalInBTC -= ticketAfter.priceBTC;
      }
    } else if (ticketWasConfirmed && !ticketIsConfirmed) {
      newConfirmedTicketCount -= 1;
      newTotalInBTC -= ticketAfter.priceBTC;
    } else if (ticketWasExpired && !ticketIsExpired) {
      newTicketsAvailable -= 1;
    }
  }

  // remove our commission from the total
  newTotalInBTC = (newTotalInBTC * (100 - TICKET_COMMISSION_PERCENTAGE)) / 100;

  const newLotStats = {
    totalAvailableTickets: newTicketsAvailable,
    totalConfirmedTickets: newConfirmedTicketCount,
    totalBTC: numberToDigits(newTotalInBTC, MAX_BTC_DIGITS),
  };

  return newLotStats;
};
