import { Ticket, TicketStatus } from '../models';
import { getTimeAsISOString } from '../utils/getTimeAsISOString';

export const markTicketsStatus = (
  tickets: Ticket[],
  status: TicketStatus,
): Ticket[] => {
  const newTickets: Ticket[] = [];

  tickets.forEach((ticket) => {
    const newTicket: Ticket = {
      ...ticket,
      status,
      confirmedTime: getTimeAsISOString(),
    };

    newTickets.push(newTicket);
  });

  return newTickets;
};
