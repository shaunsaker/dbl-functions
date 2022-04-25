import moment = require('moment');
import { BtcPayServerInvoice } from '../services/btcPayServer/models';
import { UserId } from '../userProfile/models';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';
import {
  Lot,
  LotId,
  PER_USER_TICKET_LIMIT,
  TARGET_TICKET_VALUE_USD,
  Ticket,
  TicketStatus,
  TICKET_TIMEOUT_MINUTES,
} from './models';

export const makeLot = ({
  id,
  active,
  totalAvailableTickets,
  dateCreated = getTimeAsISOString(),
  drawTime = '',
  totalBTC = 0,
  totalConfirmedTickets = 0,
  perUserTicketLimit = PER_USER_TICKET_LIMIT,
  ticketPriceUSD = TARGET_TICKET_VALUE_USD,
}: { id: LotId; active: boolean; totalAvailableTickets: number } & Partial<
  Omit<Lot, 'id' | 'active' | 'totalAvailableTickets'>
>): Lot => {
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
    active,
    totalTickets: totalAvailableTickets,
    totalAvailableTickets,
    dateCreated,
    lastCallTime: lastCallTimeString,
    drawTime: drawTimeString,
    totalBTC,
    totalConfirmedTickets,
    perUserTicketLimit,
    ticketPriceUSD,
  };
};

export const makeTicket = ({
  id = getUuid(),
  lotId = getUuid(),
  uid = '',
  priceBTC = 0,
  status = TicketStatus.reserved,
  dateCreated = getTimeAsISOString(),
  invoiceId = getUuid(),
}: Partial<Ticket>): Ticket => ({
  id,
  lotId,
  uid,
  priceBTC,
  status,
  dateCreated,
  invoiceId,
});

// TODO: SS move this to btcPayServer/models
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

export interface WinnerData {
  uid: UserId;
}
