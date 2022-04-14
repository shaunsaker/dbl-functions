import moment = require('moment');
import { BtcPayServerStoreId } from '../services/btcPayServer/models';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { Lot, LotId, PER_USER_TICKET_LIMIT, TICKET_TIMEOUT_MS } from './models';

export const makeLot = ({
  id,
  storeId,
  ticketPriceInBTC,
  BTCPriceInUSD,
  ticketCommissionInBTC,
  ticketsAvailable,
}: {
  id: LotId;
  storeId: BtcPayServerStoreId;
  ticketPriceInBTC: number;
  BTCPriceInUSD: number;
  ticketCommissionInBTC: number;
  ticketsAvailable: number;
}): Lot => {
  const now = moment();
  const drawTime = now.clone().endOf('day').subtract({ minutes: 1 }); // 23h59 today // TODO: SS just make this midnight
  const ticketTimeoutMs = TICKET_TIMEOUT_MS;
  const lastCallTime = drawTime
    .clone()
    .subtract({ milliseconds: ticketTimeoutMs });

  return {
    id,
    storeId,
    dateCreated: getTimeAsISOString(now),
    lastCallTime: getTimeAsISOString(lastCallTime),
    drawTime: getTimeAsISOString(drawTime),
    active: true,
    totalInBTC: 0,
    confirmedTicketCount: 0,
    perUserTicketLimit: PER_USER_TICKET_LIMIT,
    ticketPriceInBTC,
    BTCPriceInUSD,
    ticketCommissionInBTC,
    ticketsAvailable,
  };
};
