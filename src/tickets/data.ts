import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';
import { TicketStatus, Ticket } from './models';

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
