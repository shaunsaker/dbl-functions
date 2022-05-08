import { getTimeAsISOString } from '../../utils/getTimeAsISOString';
import { getUuid } from '../../utils/getUuid';
import { Invoice, InvoiceStatus } from './models';

export const makeInvoice = ({
  id = getUuid(),
  lotId = getUuid(),
  uid = getUuid(),
  dateCreated = getTimeAsISOString(),
  address = getUuid(),
  amountBTC = 0.005,
  rate = 40000,
  expiry = getTimeAsISOString(),
  ticketIds = [getUuid()],
  status = InvoiceStatus.reserved,
}: Partial<Invoice>): Invoice => ({
  id,
  lotId,
  uid,
  dateCreated,
  address,
  amountBTC,
  rate,
  expiry,
  ticketIds,
  status,
});
