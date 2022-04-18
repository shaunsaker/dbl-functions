import { Ticket, TicketStatus } from '../lots/models';

export const markTicketsStatus = (
  tickets: Ticket[],
  status: TicketStatus,
): Ticket[] => {
  const newTickets: Ticket[] = [];

  tickets.forEach((ticket) => {
    const newTicket: Ticket = {
      ...ticket,
      status,
    };

    newTickets.push(newTicket);
  });

  return newTickets;
};
