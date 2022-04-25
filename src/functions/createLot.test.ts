import { makeLot } from '../lots/data';
import { makeBtcPayServerStore } from '../services/btcPayServer/data';
import { getUuid } from '../utils/getUuid';
import {
  getInvoiceExpiredWebhook,
  getInvoiceSettledWebhook,
  getPaymentReceivedWebhook,
  getTicketsAvailable,
} from './createLot';
import { setupCreateLotTest } from './createLot.testUtils';

describe('createLot', () => {
  describe('getTicketsAvailable', () => {
    it('returns the tickets available', () => {
      const targetLotValueUSD = 1000000;
      const targetTicketValueUSD = 10;
      const ticketCommissionPercentage = 10;
      const avgBTCDailyFluctuationPercentage = 2;
      const totalAvailableTickets = getTicketsAvailable({
        targetLotValueUSD,
        targetTicketValueUSD,
        ticketCommissionPercentage,
        avgBTCDailyFluctuationPercentage,
      });

      expect(totalAvailableTickets).toEqual(113637);
    });
  });

  describe('createLot', () => {
    const lotId = '2018-08-26';
    const active = true;

    it('returns an error if a lot already exists', async () => {
      const { response } = await setupCreateLotTest({
        lotId,
        active,
        lotExists: true,
      });

      expect(response).toEqual({
        error: true,
        message: `lot with id ${lotId} already exists fool.`,
      });
    });

    it('creates a lot', async () => {
      const BTCPriceInUSD = 50000;
      const storeId = getUuid();
      const { dependencies } = await setupCreateLotTest({
        lotId,
        active,
        BTCPriceInUSD,
        storeId,
      });

      expect(dependencies.firebaseFetchLot).toHaveBeenCalledWith(lotId);
      expect(dependencies.createStore).toHaveBeenCalledWith(
        makeBtcPayServerStore({ name: lotId }),
      );
      expect(dependencies.createStoreWallet).toHaveBeenCalledWith(storeId, {
        existingMnemonic: expect.any(String),
        passphrase: expect.any(String),
      });
      expect(dependencies.firebaseCreateLotStoreWalletKey).toHaveBeenCalledWith(
        {
          lotId,
          storeId,
          data: {
            hash: expect.any(Object),
          },
        },
      );
      expect(dependencies.createWebhook).toHaveBeenCalledWith(storeId, {
        ...getPaymentReceivedWebhook(),
        id: expect.any(String),
      });
      expect(dependencies.createWebhook).toHaveBeenCalledWith(storeId, {
        ...getInvoiceSettledWebhook(),
        id: expect.any(String),
      });
      expect(dependencies.createWebhook).toHaveBeenCalledWith(storeId, {
        ...getInvoiceExpiredWebhook(),
        id: expect.any(String),
      });
      expect(dependencies.firebaseCreateLot).toHaveBeenCalledWith({
        ...makeLot({
          id: lotId,
          active: true,
          dateCreated: expect.any(String),
          drawTime: expect.any(String),
          totalAvailableTickets: expect.any(Number),
          totalTickets: expect.any(Number),
        }),
      });
    });
  });
});
