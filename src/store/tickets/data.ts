import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { getUuid } from '../../utils/getUuid';
import { Ticket } from './models';

export const makeTicket = ({
  id = getUuid(),
  lotId = getUuid(),
  uid = '',
  priceBTC = 0,
  dateCreated = getTimeAsISOString(),
  invoiceId = getUuid(),
}: Partial<Ticket>): Ticket => ({
  id,
  lotId,
  uid,
  priceBTC,
  dateCreated,
  invoiceId,
});
