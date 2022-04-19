import { Lot, Ticket, TicketStatus } from '../../lots/models';

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
  let newTicketsAvailable = lot.ticketsAvailable;
  let newConfirmedTicketCount = lot.confirmedTicketCount;
  let newTotalInBTC = lot.totalInBTC;

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
        newTotalInBTC += lot.ticketPriceInBTC;
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
        newTotalInBTC -= lot.ticketPriceInBTC;
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
      newTotalInBTC += lot.ticketPriceInBTC;

      if (ticketWasExpired) {
        newTicketsAvailable -= 1;
      }
    } else if (ticketBecameExpired) {
      newTicketsAvailable += 1;

      if (ticketWasConfirmed) {
        newConfirmedTicketCount -= 1;
        newTotalInBTC -= lot.ticketPriceInBTC;
      }
    } else if (ticketWasConfirmed && !ticketIsConfirmed) {
      newConfirmedTicketCount -= 1;
      newTotalInBTC -= lot.ticketPriceInBTC;
    } else if (ticketWasExpired && !ticketIsExpired) {
      newTicketsAvailable -= 1;
    }
  }

  const newLotStats = {
    ticketsAvailable: newTicketsAvailable,
    confirmedTicketCount: newConfirmedTicketCount,
    totalInBTC: newTotalInBTC,
  };

  return newLotStats;
};
