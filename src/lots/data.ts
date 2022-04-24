import moment = require('moment');
import { BtcPayServerInvoice } from '../services/btcPayServer/models';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';
import {
  Lot,
  PER_USER_TICKET_LIMIT,
  TARGET_TICKET_VALUE_USD,
  Ticket,
  TicketStatus,
  TICKET_TIMEOUT_MINUTES,
} from './models';

export const makeLot = ({
  id = getUuid(),
  dateCreated = getTimeAsISOString(moment()),
  drawTime = getTimeAsISOString(moment()),
  active = true,
  totalBTC = 0,
  totalConfirmedTickets = 0,
  perUserTicketLimit = PER_USER_TICKET_LIMIT,
  totalAvailableTickets = 0,
  ticketPriceUSD = TARGET_TICKET_VALUE_USD,
}: Partial<Lot>): Lot => {
  // get the draw time from the lotId
  // NOTE: this will not work if we're doing multiple lots on the same day
  const drawTimeMoment = moment(id).clone().endOf('day');
  const drawTimeString = drawTime || getTimeAsISOString(drawTimeMoment);

  // get the last call time, ie. TICKET_TIMEOUT_MINUTES before 00h00 tonight
  const lastCallTimeString = getTimeAsISOString(
    drawTimeMoment.clone().subtract({ minutes: TICKET_TIMEOUT_MINUTES }),
  );

  return {
    id,
    dateCreated,
    lastCallTime: lastCallTimeString,
    drawTime: drawTimeString,
    active,
    totalBTC,
    totalTickets: totalAvailableTickets,
    totalConfirmedTickets,
    perUserTicketLimit,
    totalAvailableTickets,
    ticketPriceUSD,
  };
};

export const makeTicket = ({
  id = getUuid(),
  uid = '',
  priceBTC = 0,
  status = TicketStatus.reserved,
  dateCreated = getTimeAsISOString(),
  invoicePaymentAddress = '',
  invoicePaymentAmountBTC = 0,
  invoicePaymentRate = 0,
  invoicePaymentExpiry = '',
  invoiceTicketIds = [],
}: Partial<Ticket>): Ticket => ({
  id,
  uid,
  priceBTC,
  status,
  dateCreated,
  invoicePaymentAddress,
  invoicePaymentAmountBTC,
  invoicePaymentRate,
  invoicePaymentExpiry,
  invoiceTicketIds,
});

export const makeInvoice = ({
  metadata: { uid, lotId, ticketIds } = {
    uid: getUuid(),
    lotId: getUuid(),
    ticketIds: [getUuid()],
  },
  amount,
}: Partial<BtcPayServerInvoice>): BtcPayServerInvoice => ({
  metadata: {
    uid,
    lotId,
    ticketIds,
  },
  checkout: {
    speedPolicy: 'LowSpeed',
  },
  amount: amount || '',
  id: getUuid(),
  storeId: getUuid(),
  currency: 'BTC',
  type: '',
  checkoutLink: '',
  dateCreated: 0,
  expirationTime: 0,
  monitoringTime: 0,
  status: '',
  additionalStatus: '',
  availableStatusesForManualMarking: [],
  archived: false,
});
