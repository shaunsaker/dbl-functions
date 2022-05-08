import { makeInvoice } from '../../store/invoices/data';
import { InvoiceStatus } from '../../store/invoices/models';
import { makeLot } from '../../store/lots/data';
import { getUuid } from '../../utils/getUuid';
import { getLotStats } from './getLotStats';

describe('getLotStats', () => {
  const lot = makeLot({
    id: getUuid(),
    active: true,
    totalAvailableTickets: 100000,
    totalConfirmedTickets: 0,
    totalBTC: 0,
  });

  describe('invoice added', () => {
    it('reserved', () => {
      const invoiceBefore = undefined;
      const invoiceAfter = makeInvoice({ status: InvoiceStatus.reserved });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets - 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived', () => {
      const invoiceBefore = undefined;
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets - 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('confirmed', () => {
      const invoiceBefore = undefined;
      const invoiceAfter = makeInvoice({ status: InvoiceStatus.confirmed });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets - 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets + 1);
      expect(totalBTC).toEqual(lot.totalBTC + invoiceAfter.amountBTC);
    });

    it('expired', () => {
      const invoiceBefore = undefined;
      const invoiceAfter = makeInvoice({ status: InvoiceStatus.expired });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      // nothing should change
      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });
  });

  describe('invoice deleted', () => {
    it('reserved', () => {
      const invoiceBefore = makeInvoice({ status: InvoiceStatus.reserved });
      const invoiceAfter = undefined;
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets + 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const invoiceAfter = undefined;
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets + 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('confirmed', () => {
      const invoiceBefore = makeInvoice({ status: InvoiceStatus.confirmed });
      const invoiceAfter = undefined;
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets + 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets - 1);
      expect(totalBTC).toEqual(lot.totalBTC - invoiceBefore.amountBTC);
    });

    it('expired', () => {
      const invoiceBefore = makeInvoice({ status: InvoiceStatus.expired });
      const invoiceAfter = undefined;
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      // nothing should change
      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });
  });

  describe('invoice changed', () => {
    it('reserved => reserved', () => {
      const invoiceBefore = makeInvoice({ status: InvoiceStatus.reserved });
      const invoiceAfter = makeInvoice({ status: InvoiceStatus.reserved });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      // nothing should change
      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('reserved => paymentReceived', () => {
      const invoiceBefore = makeInvoice({ status: InvoiceStatus.reserved });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      // nothing should change
      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('reserved => confirmed', () => {
      const invoiceBefore = makeInvoice({ status: InvoiceStatus.reserved });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.confirmed,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets + 1);
      expect(totalBTC).toEqual(lot.totalBTC + invoiceAfter.amountBTC);
    });

    it('reserved => expired', () => {
      const invoiceBefore = makeInvoice({ status: InvoiceStatus.reserved });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.expired,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets + 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived => reserved', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.reserved,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      // nothing should change
      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived => paymentReceived', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      // nothing should change
      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived => confirmed', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.confirmed,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets + 1);
      expect(totalBTC).toEqual(lot.totalBTC + invoiceAfter.amountBTC);
    });

    it('paymentReceived => expired', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.expired,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets + 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('confirmed => reserved', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.confirmed,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.reserved,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets - 1);
      expect(totalBTC).toEqual(lot.totalBTC - invoiceAfter.amountBTC);
    });

    it('confirmed => paymentReceived', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.confirmed,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets - 1);
      expect(totalBTC).toEqual(lot.totalBTC - invoiceAfter.amountBTC);
    });

    it('confirmed => confirmed', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.confirmed,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.confirmed,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      // nothing should change
      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('confirmed => expired', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.confirmed,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.expired,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets + 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets - 1);
      expect(totalBTC).toEqual(lot.totalBTC - invoiceAfter.amountBTC);
    });

    it('expired => reserved', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.expired,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.reserved,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets - 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('expired => paymentReceived', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.expired,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.paymentReceived,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets - 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('expired => confirmed', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.expired,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.confirmed,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets - 1);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets + 1);
      expect(totalBTC).toEqual(lot.totalBTC + invoiceAfter.amountBTC);
    });

    it('expired => expired', () => {
      const invoiceBefore = makeInvoice({
        status: InvoiceStatus.expired,
      });
      const invoiceAfter = makeInvoice({
        status: InvoiceStatus.expired,
      });
      const { totalAvailableTickets, totalConfirmedTickets, totalBTC } =
        getLotStats({
          lot,
          invoiceBefore,
          invoiceAfter,
        });

      // nothing should change
      expect(totalAvailableTickets).toEqual(lot.totalAvailableTickets);
      expect(totalConfirmedTickets).toEqual(lot.totalConfirmedTickets);
      expect(totalBTC).toEqual(lot.totalBTC);
    });
  });
});
