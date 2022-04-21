import { makeLot, makeTicket } from '../../lots/data';
import { TicketStatus } from '../../lots/models';
import { getLotStats } from './getLotStats';

describe('getLotStats', () => {
  const lot = makeLot({
    ticketsAvailable: 100000,
    confirmedTicketCount: 0,
    totalBTC: 0,
  });

  describe('ticket added', () => {
    it('reserved', () => {
      const ticketBefore = undefined;
      const ticketAfter = makeTicket({ status: TicketStatus.reserved });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived', () => {
      const ticketBefore = undefined;
      const ticketAfter = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('confirmed', () => {
      const ticketBefore = undefined;
      const ticketAfter = makeTicket({ status: TicketStatus.confirmed });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount + 1);
      expect(totalBTC).toEqual(lot.totalBTC + ticketAfter.priceBTC);
    });

    it('expired', () => {
      const ticketBefore = undefined;
      const ticketAfter = makeTicket({ status: TicketStatus.expired });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      // nothing should change
      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });
  });

  describe('ticket deleted', () => {
    it('reserved', () => {
      const ticketBefore = makeTicket({ status: TicketStatus.reserved });
      const ticketAfter = undefined;
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const ticketAfter = undefined;
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('confirmed', () => {
      const ticketBefore = makeTicket({ status: TicketStatus.confirmed });
      const ticketAfter = undefined;
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount - 1);
      expect(totalBTC).toEqual(lot.totalBTC - ticketBefore.priceBTC);
    });

    it('expired', () => {
      const ticketBefore = makeTicket({ status: TicketStatus.expired });
      const ticketAfter = undefined;
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      // nothing should change
      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });
  });

  describe('ticket changed', () => {
    it('reserved => reserved', () => {
      const ticketBefore = makeTicket({ status: TicketStatus.reserved });
      const ticketAfter = makeTicket({ status: TicketStatus.reserved });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      // nothing should change
      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('reserved => paymentReceived', () => {
      const ticketBefore = makeTicket({ status: TicketStatus.reserved });
      const ticketAfter = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      // nothing should change
      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('reserved => confirmed', () => {
      const ticketBefore = makeTicket({ status: TicketStatus.reserved });
      const ticketAfter = makeTicket({
        status: TicketStatus.confirmed,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount + 1);
      expect(totalBTC).toEqual(lot.totalBTC + ticketAfter.priceBTC);
    });

    it('reserved => expired', () => {
      const ticketBefore = makeTicket({ status: TicketStatus.reserved });
      const ticketAfter = makeTicket({
        status: TicketStatus.expired,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived => reserved', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.reserved,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      // nothing should change
      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived => paymentReceived', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      // nothing should change
      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('paymentReceived => confirmed', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.confirmed,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount + 1);
      expect(totalBTC).toEqual(lot.totalBTC + ticketAfter.priceBTC);
    });

    it('paymentReceived => expired', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.expired,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('confirmed => reserved', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.confirmed,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.reserved,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount - 1);
      expect(totalBTC).toEqual(lot.totalBTC - ticketAfter.priceBTC);
    });

    it('confirmed => paymentReceived', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.confirmed,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount - 1);
      expect(totalBTC).toEqual(lot.totalBTC - ticketAfter.priceBTC);
    });

    it('confirmed => confirmed', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.confirmed,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.confirmed,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      // nothing should change
      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('confirmed => expired', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.confirmed,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.expired,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount - 1);
      expect(totalBTC).toEqual(lot.totalBTC - ticketAfter.priceBTC);
    });

    it('expired => reserved', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.expired,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.reserved,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('expired => paymentReceived', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.expired,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.paymentReceived,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });

    it('expired => confirmed', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.expired,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.confirmed,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount + 1);
      expect(totalBTC).toEqual(lot.totalBTC + ticketAfter.priceBTC);
    });

    it('expired => expired', () => {
      const ticketBefore = makeTicket({
        status: TicketStatus.expired,
      });
      const ticketAfter = makeTicket({
        status: TicketStatus.expired,
      });
      const { ticketsAvailable, confirmedTicketCount, totalBTC } = getLotStats({
        lot,
        ticketBefore,
        ticketAfter,
      });

      // nothing should change
      expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
      expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
      expect(totalBTC).toEqual(lot.totalBTC);
    });
  });
});
