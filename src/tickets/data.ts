import { TicketStatus, Ticket } from '../lots/models';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';
import { getUuid } from '../utils/getUuid';

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
