import moment = require('moment');
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import {
  Lot,
  LotId,
  PER_USER_TICKET_LIMIT,
  TARGET_TICKET_VALUE_USD,
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
  const drawTimeMoment = moment(id).clone().startOf('day').add({ days: 1 }); // 00:00
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
