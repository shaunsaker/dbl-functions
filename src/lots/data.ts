import moment = require('moment');
import { BtcPayServerInvoice } from '../services/btcPayServer/models';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';
import {
  Lot,
  PER_USER_TICKET_LIMIT,
  Ticket,
  TicketStatus,
  TICKET_TIMEOUT_MS,
} from './models';

export const makeLot = ({
  id,
  dateCreated,
  lastCallTime,
  drawTime,
  active,
  totalInBTC,
  confirmedTicketCount,
  perUserTicketLimit,
  ticketPriceInBTC,
  BTCPriceInUSD,
  ticketCommissionInBTC,
  ticketsAvailable,
}: Partial<Lot>): Lot => {
  // get the draw time, ie. 00h00 tonight
  const now = moment();
  const drawTimeMoment = now.clone().endOf('day');
  const drawTimeString = drawTime || getTimeAsISOString(drawTimeMoment);

  // get the last call time, ie. ticketTimeoutMs before 00h00 tonight
  const ticketTimeoutMs = TICKET_TIMEOUT_MS;
  const lastCallTimeString =
    lastCallTime ||
    getTimeAsISOString(
      drawTimeMoment.clone().subtract({ milliseconds: ticketTimeoutMs }),
    );

  return {
    id: id || getUuid(),
    dateCreated: dateCreated || getTimeAsISOString(now),
    lastCallTime: lastCallTimeString,
    drawTime: drawTimeString,
    active: active || true,
    totalInBTC: totalInBTC || 0,
    confirmedTicketCount: confirmedTicketCount || 0,
    perUserTicketLimit: perUserTicketLimit || PER_USER_TICKET_LIMIT,
    ticketPriceInBTC: ticketPriceInBTC || 0.00025,
    BTCPriceInUSD: BTCPriceInUSD || 40000,
    ticketCommissionInBTC: ticketCommissionInBTC || 0.000025,
    ticketsAvailable: ticketsAvailable || 100000,
  };
};

export const makeTicket = ({
  id,
  uid,
  price,
  status,
  dateCreated,
}: Partial<Ticket>): Ticket => ({
  id: id || getUuid(),
  uid: uid || getUuid(),
  price: price || 0.00025,
  status: status || TicketStatus.reserved,
  dateCreated: dateCreated || getTimeAsISOString(),
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
