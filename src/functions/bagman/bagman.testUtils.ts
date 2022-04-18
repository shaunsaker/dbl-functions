import { runBagman } from '.';
import { makeInvoice, makeLot, makeTicket } from '../../lots/data';
import { Lot, Ticket } from '../../lots/models';
import { makeBtcPayServerInvoiceReceivedPaymentEventData } from '../../services/btcPayServer/data';
import {
  BtcPayServerInvoice,
  BtcPayServerInvoiceId,
  BtcPayServerStoreId,
} from '../../services/btcPayServer/models';
import { makeUserProfileData } from '../../userProfile/data';
import { UserProfileData } from '../../userProfile/models';
import { getUuid } from '../../utils/getUuid';
import { markTicketsStatus } from '../markTicketsStatus';

export const setupBagmanTest = async ({
  storeId = getUuid(),
  invoiceId = getUuid(),
  invoice = makeInvoice({}),
  userProfileData = makeUserProfileData({}),
  lot = makeLot({}),
  tickets = [makeTicket({})],
}: {
  storeId?: BtcPayServerStoreId;
  invoiceId?: BtcPayServerInvoiceId;
  invoice?: BtcPayServerInvoice | null;
  userProfileData?: UserProfileData | null;
  lot?: Lot | null;
  tickets?: Ticket[];
}) => {
  const getInvoice = jest.fn();
  const firebaseFetchUserProfile = jest.fn();
  const firebaseFetchLot = jest.fn();
  const firebaseFetchTickets = jest.fn();
  const saveTickets = jest.fn();
  const createTickets = jest.fn();
  const updateInvoice = jest.fn();
  const firebaseSendNotification = jest.fn();

  if (invoice) {
    getInvoice.mockReturnValue(invoice);
  }

  if (userProfileData) {
    firebaseFetchUserProfile.mockReturnValue(userProfileData);
  }

  if (lot) {
    firebaseFetchLot.mockReturnValue(lot);
  }

  if (tickets) {
    firebaseFetchTickets.mockReturnValue(tickets);
  }

  // create the webhook payment event
  const paymentValueUSD = 10;
  const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
    storeId,
    invoiceId,
    value: paymentValueUSD,
  });

  const response = await runBagman(eventData, {
    getInvoice,
    firebaseFetchUserProfile,
    firebaseFetchLot,
    firebaseFetchTickets,
    markTicketsStatus,
    saveTickets,
    createTickets,
    updateInvoice,
    firebaseSendNotification,
  });

  return { response };
};
