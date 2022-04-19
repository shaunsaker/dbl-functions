import { makeLot } from '../lots/data';
import { makeBtcPayServerStore } from '../services/btcPayServer/data';
import { getUuid } from '../utils/getUuid';
import {
  getInvoiceExpiredWebhook,
  getInvoiceSettledWebhook,
  getLotId,
  getPaymentReceivedWebhook,
  getTicketCommission,
  getTicketPrice,
  getTicketsAvailable,
} from './createLot';
import { setupCreateLotTest } from './createLot.testUtils';

describe('createLot', () => {
  describe('getTicketsAvailable', () => {
    it('returns the tickets available', () => {
      const targetLotValueUSD = 1000000;
      const targetTicketValueUSD = 10;
      const ticketsAvailable = getTicketsAvailable({
        targetLotValueUSD,
        targetTicketValueUSD,
      });

      expect(ticketsAvailable).toEqual(100000);
    });
  });

  describe('getTicketPrice', () => {
    it('returns the tickets price in BTC', () => {
      const targetLotValueUSD = 1000000;
      const BTCPriceInUSD = 40000;
      const ticketsAvailable = 100000;
      const ticketCommissionPercentage = 10;
      const ticketPrice = getTicketPrice({
        targetLotValueUSD,
        BTCPriceInUSD,
        ticketsAvailable,
        ticketCommissionPercentage,
      });

      expect(ticketPrice).toEqual(0.000275);
    });
  });

  describe('getTicketCommission', () => {
    it('returns the ticket commission in BTC', () => {
      const ticketPriceInBTC = 0.025;
      const ticketCommissionPercentage = 10;
      const ticketCommission = getTicketCommission({
        ticketPriceInBTC,
        ticketCommissionPercentage,
      });

      expect(ticketCommission).toEqual(0.0025);
    });
  });

  it('creates a lot', async () => {
    const BTCPriceInUSD = 50000;
    const storeId = getUuid();
    const { dependencies } = await setupCreateLotTest({
      BTCPriceInUSD,
      storeId,
    });

    expect(dependencies.getBTCUSDPrice).toHaveBeenCalled();
    expect(dependencies.createStore).toHaveBeenCalledWith(
      makeBtcPayServerStore({ name: getLotId() }),
    );
    expect(dependencies.createStoreWallet).toHaveBeenCalledWith(storeId, {
      existingMnemonic: expect.any(String),
      passphrase: expect.any(String),
    });
    expect(dependencies.firebaseSaveStoreData).toHaveBeenCalledWith(storeId, {
      hash: expect.any(Object),
    });
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
        id: getLotId(),
        dateCreated: expect.any(String),
        BTCPriceInUSD,
        ticketPriceInBTC: expect.any(Number), // tested above
        ticketCommissionInBTC: expect.any(Number),
        ticketsAvailable: expect.any(Number),
      }),
    });
  });
});
