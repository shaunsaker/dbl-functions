import { Invoice, InvoiceStatus } from '../../store/invoices/models';
import { Lot, MAX_BTC_DIGITS } from '../../store/lots/models';
import { numberToDigits } from '../../utils/numberToDigits';

// NOTE: this covers a lot of scenarios and looks complicated, see tests for clarity
export const getLotStats = ({
  lot,
  invoiceBefore,
  invoiceAfter,
}: {
  lot: Lot;
  invoiceBefore: Invoice | undefined;
  invoiceAfter: Invoice | undefined;
}) => {
  let newTicketsAvailable = lot.totalAvailableTickets;
  let newConfirmedTicketCount = lot.totalConfirmedTickets;
  let newTotalInBTC = lot.totalBTC;

  const invoiceWasAdded = !invoiceBefore;
  const invoiceWasDeleted = !invoiceAfter;
  const invoiceChanged = !invoiceWasAdded && !invoiceWasDeleted;

  if (invoiceWasAdded) {
    // reserved ✅
    // paymentReceived ✅
    // confirmed ✅
    // expired ⛔
    const newInvoiceIsNotExpired =
      invoiceAfter?.status !== InvoiceStatus.expired;
    const newInvoiceIsConfirmed =
      invoiceAfter?.status === InvoiceStatus.confirmed;

    // if any invoice besides an expired one was added
    if (newInvoiceIsNotExpired) {
      newTicketsAvailable -= invoiceAfter?.ticketIds.length || 0;

      // if a confirmed invoice was added also do the following
      if (newInvoiceIsConfirmed) {
        newConfirmedTicketCount += invoiceAfter?.ticketIds.length || 0;
        newTotalInBTC += invoiceAfter.amountBTC;
      }
    }
  } else if (invoiceWasDeleted) {
    // reserved ✅
    // paymentReceived ✅
    // confirmed ✅
    // expired ⛔
    const ticketWasNotExpired = invoiceBefore?.status !== InvoiceStatus.expired;
    const invoiceWasConfirmed =
      invoiceBefore?.status === InvoiceStatus.confirmed;

    if (ticketWasNotExpired) {
      newTicketsAvailable += invoiceBefore?.ticketIds.length || 0;

      if (invoiceWasConfirmed) {
        newConfirmedTicketCount -= invoiceBefore?.ticketIds.length || 0;
        newTotalInBTC -= invoiceBefore.amountBTC;
      }
    }
  } else if (invoiceChanged) {
    // SUMMARY: we only act if:
    // a invoice became confirmed/expired
    // a invoice changed from confirmed/expired
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

    const invoiceWasConfirmed =
      invoiceBefore.status === InvoiceStatus.confirmed;
    const invoiceWasExpired = invoiceBefore.status === InvoiceStatus.expired;
    const invoiceIsConfirmed = invoiceAfter.status === InvoiceStatus.confirmed;
    const invoiceIsExpired = invoiceAfter.status === InvoiceStatus.expired;
    const invoiceBecameConfirmed = !invoiceWasConfirmed && invoiceIsConfirmed;
    const invoiceBecameExpired =
      !invoiceWasExpired && invoiceAfter.status === InvoiceStatus.expired;

    if (invoiceBecameConfirmed) {
      newConfirmedTicketCount += invoiceAfter?.ticketIds.length || 0;
      newTotalInBTC += invoiceAfter.amountBTC;

      if (invoiceWasExpired) {
        newTicketsAvailable -= invoiceAfter?.ticketIds.length || 0;
      }
    } else if (invoiceBecameExpired) {
      newTicketsAvailable += invoiceAfter?.ticketIds.length || 0;

      if (invoiceWasConfirmed) {
        newConfirmedTicketCount -= invoiceAfter?.ticketIds.length || 0;
        newTotalInBTC -= invoiceAfter.amountBTC;
      }
    } else if (invoiceWasConfirmed && !invoiceIsConfirmed) {
      newConfirmedTicketCount -= invoiceAfter?.ticketIds.length || 0;
      newTotalInBTC -= invoiceAfter.amountBTC;
    } else if (invoiceWasExpired && !invoiceIsExpired) {
      newTicketsAvailable -= invoiceAfter?.ticketIds.length || 0;
    }
  }

  const newLotStats = {
    totalAvailableTickets: newTicketsAvailable,
    totalConfirmedTickets: newConfirmedTicketCount,
    totalBTC: numberToDigits(newTotalInBTC, MAX_BTC_DIGITS),
  };

  return newLotStats;
};
