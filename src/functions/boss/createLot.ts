import moment = require('moment');
import {
  Lot,
  LotId,
  PER_USER_TICKET_LIMIT,
  TARGET_LOT_VALUE_USD,
  TARGET_TICKET_VALUE_USD,
  TICKET_COMMISSION_PERCENTAGE,
  TICKET_TIMEOUT_MS,
} from '../../models';
import { getBTCUSDPrice } from '../../services/binance/getBTCUSDPrice';
import { createBlockchainAddress } from '../../services/blockCypher/createBlockchainAddress';
import { firebaseCreateLot } from '../../services/firebase/firebaseCreateLot';
import { firebaseSaveLotAddress } from '../../services/firebase/firebaseSaveLotAddress';
import { encrypt } from '../../utils/crypto';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { numberToDigits } from '../../utils/numberToDigits';

const makeLot = ({
  id,
  ticketPriceInBTC,
  BTCPriceInUSD,
  ticketCommissionInBTC,
  ticketsAvailable,
  address,
}: {
  id: LotId;
  ticketPriceInBTC: number;
  BTCPriceInUSD: number;
  ticketCommissionInBTC: number;
  ticketsAvailable: number;
  address: string;
}): Lot => {
  const now = moment();
  const drawTime = now.clone().endOf('day').subtract({ minutes: 1 }); // 23h59 today
  const ticketTimeoutMs = TICKET_TIMEOUT_MS;
  const lastCallTime = drawTime
    .clone()
    .subtract({ milliseconds: ticketTimeoutMs });

  return {
    id,
    dateCreated: getTimeAsISOString(now),
    lastCallTime: getTimeAsISOString(lastCallTime),
    drawTime: getTimeAsISOString(drawTime),
    active: true,
    totalInBTC: 0,
    confirmedTicketCount: 0,
    perUserTicketLimit: PER_USER_TICKET_LIMIT,
    ticketTimeoutMs: TICKET_TIMEOUT_MS,
    ticketPriceInBTC,
    BTCPriceInUSD,
    ticketCommissionInBTC,
    ticketsAvailable,
    address,
  };
};

export const createLot = async (): Promise<void> => {
  // fetch the btc price in usd
  const BTCPriceInUSD = await getBTCUSDPrice();

  // // calculate the amount of tickets available
  const ticketsAvailable = Math.ceil(
    TARGET_LOT_VALUE_USD / TARGET_TICKET_VALUE_USD,
  );

  // calculate the ticket price
  const targetLotValueBTC = TARGET_LOT_VALUE_USD / BTCPriceInUSD;
  const ticketPriceInBTC = numberToDigits(
    targetLotValueBTC / ticketsAvailable,
    6,
  );

  // calculate the commission
  const ticketCommissionInBTC = numberToDigits(
    (ticketPriceInBTC * TICKET_COMMISSION_PERCENTAGE) / 100,
    6,
  );

  const addressKeychain = await createBlockchainAddress();

  // save the private key as a hash using the secret
  // (we need to be able to move funds from this address later)
  const hash = encrypt(addressKeychain.private, process.env.LOT_ADDRESS_SECRET);

  const lotId: LotId = getTimeAsISOString(moment().startOf('day')); // the id is the start time of the day

  await firebaseSaveLotAddress(lotId, hash);

  const lot = makeLot({
    id: lotId,
    BTCPriceInUSD,
    ticketPriceInBTC,
    ticketCommissionInBTC,
    ticketsAvailable,
    address: addressKeychain.address,
  });

  await firebaseCreateLot(lot);
};
