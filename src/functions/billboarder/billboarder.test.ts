import { getLotStats } from '.';
import { makeLot, makeTicket } from '../../lots/data';
import { TicketStatus } from '../../lots/models';

describe('billboarder', () => {
  describe('getLotStats', () => {
    const lot = makeLot({
      ticketsAvailable: 100000,
      confirmedTicketCount: 0,
      totalInBTC: 0,
    });

    describe('ticket added', () => {
      it('reserved', () => {
        const ticketBefore = undefined;
        const ticketAfter = makeTicket({ status: TicketStatus.reserved });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('paymentReceived', () => {
        const ticketBefore = undefined;
        const ticketAfter = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('confirmed', () => {
        const ticketBefore = undefined;
        const ticketAfter = makeTicket({ status: TicketStatus.confirmed });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount + 1);
        expect(totalInBTC).toEqual(lot.totalInBTC + lot.ticketPriceInBTC);
      });

      it('expired', () => {
        const ticketBefore = undefined;
        const ticketAfter = makeTicket({ status: TicketStatus.expired });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        // nothing should change
        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });
    });

    describe('ticket deleted', () => {
      it('reserved', () => {
        const ticketBefore = makeTicket({ status: TicketStatus.reserved });
        const ticketAfter = undefined;
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('paymentReceived', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const ticketAfter = undefined;
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('confirmed', () => {
        const ticketBefore = makeTicket({ status: TicketStatus.confirmed });
        const ticketAfter = undefined;
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount - 1);
        expect(totalInBTC).toEqual(lot.totalInBTC - lot.ticketPriceInBTC);
      });

      it('expired', () => {
        const ticketBefore = makeTicket({ status: TicketStatus.expired });
        const ticketAfter = undefined;
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        // nothing should change
        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });
    });

    describe('ticket changed', () => {
      it('reserved => reserved', () => {
        const ticketBefore = makeTicket({ status: TicketStatus.reserved });
        const ticketAfter = makeTicket({ status: TicketStatus.reserved });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        // nothing should change
        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('reserved => paymentReceived', () => {
        const ticketBefore = makeTicket({ status: TicketStatus.reserved });
        const ticketAfter = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        // nothing should change
        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('reserved => confirmed', () => {
        const ticketBefore = makeTicket({ status: TicketStatus.reserved });
        const ticketAfter = makeTicket({
          status: TicketStatus.confirmed,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount + 1);
        expect(totalInBTC).toEqual(lot.totalInBTC + lot.ticketPriceInBTC);
      });

      it('reserved => expired', () => {
        const ticketBefore = makeTicket({ status: TicketStatus.reserved });
        const ticketAfter = makeTicket({
          status: TicketStatus.expired,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('paymentReceived => reserved', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.reserved,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        // nothing should change
        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('paymentReceived => paymentReceived', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        // nothing should change
        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('paymentReceived => confirmed', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.confirmed,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount + 1);
        expect(totalInBTC).toEqual(lot.totalInBTC + lot.ticketPriceInBTC);
      });

      it('paymentReceived => expired', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.expired,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('confirmed => reserved', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.confirmed,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.reserved,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount - 1);
        expect(totalInBTC).toEqual(lot.totalInBTC - lot.ticketPriceInBTC);
      });

      it('confirmed => paymentReceived', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.confirmed,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount - 1);
        expect(totalInBTC).toEqual(lot.totalInBTC - lot.ticketPriceInBTC);
      });

      it('confirmed => confirmed', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.confirmed,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.confirmed,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        // nothing should change
        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('confirmed => expired', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.confirmed,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.expired,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable + 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount - 1);
        expect(totalInBTC).toEqual(lot.totalInBTC - lot.ticketPriceInBTC);
      });

      it('expired => reserved', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.expired,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.reserved,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('expired => paymentReceived', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.expired,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.paymentReceived,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });

      it('expired => confirmed', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.expired,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.confirmed,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        expect(ticketsAvailable).toEqual(lot.ticketsAvailable - 1);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount + 1);
        expect(totalInBTC).toEqual(lot.totalInBTC + lot.ticketPriceInBTC);
      });

      it('expired => expired', () => {
        const ticketBefore = makeTicket({
          status: TicketStatus.expired,
        });
        const ticketAfter = makeTicket({
          status: TicketStatus.expired,
        });
        const { ticketsAvailable, confirmedTicketCount, totalInBTC } =
          getLotStats({ lot, ticketBefore, ticketAfter });

        // nothing should change
        expect(ticketsAvailable).toEqual(lot.ticketsAvailable);
        expect(confirmedTicketCount).toEqual(lot.confirmedTicketCount);
        expect(totalInBTC).toEqual(lot.totalInBTC);
      });
    });
  });
});
