import { makeLot, makeTicket } from '../lots/data';
import {
  getNotEnoughTicketsAvailableResponseMessage,
  getReachedUserTicketLimitResponseMessage,
} from './createTickets';
import { setupCreateTicketsTests } from './createTickets.testUtils';

describe('createTickets', () => {
  it('returns an error if there are no more tickets available', async () => {
    const ticketsAvailable = 1;
    const lot = makeLot({ ticketsAvailable });
    const ticketCount = 2; // more than the lot.ticketsAvailable
    const { response } = await setupCreateTicketsTests({
      lot,
      ticketCount,
    });

    expect(response).toEqual({
      error: true,
      message: getNotEnoughTicketsAvailableResponseMessage({
        ticketCount,
        ticketsAvailable,
      }),
    });
  });

  it('returns an error if the user has reached their ticket limit', async () => {
    const ticketsAvailable = 10;
    const perUserTicketLimit = 5;
    const lot = makeLot({ ticketsAvailable, perUserTicketLimit });
    const ticketCount = 10;
    const { response, dependencies } = await setupCreateTicketsTests({
      lot,
      ticketCount,
    });

    expect(dependencies.firebaseFetchTickets).toHaveBeenCalled();
    expect(response).toEqual({
      error: true,
      message: getReachedUserTicketLimitResponseMessage({
        existingUserTicketCount: 0,
        perUserTicketLimit,
      }),
    });
  });

  it('creates tickets', async () => {
    const ticketsAvailable = 10;
    const perUserTicketLimit = 5;
    const lot = makeLot({ ticketsAvailable, perUserTicketLimit });
    const ticketCount = 2;
    const { dependencies } = await setupCreateTicketsTests({
      lot,
      ticketCount,
    });

    expect(dependencies.firebaseWriteBatch).toHaveBeenCalledWith([
      {
        ref: expect.any(Object), // let's not test firebase ref internals
        data: {
          ...makeTicket({}),
          id: expect.any(String),
          uid: expect.any(String),
          dateCreated: expect.any(String),
        },
      },
      {
        ref: expect.any(Object),
        data: {
          ...makeTicket({}),
          id: expect.any(String),
          uid: expect.any(String),
          dateCreated: expect.any(String),
        },
      },
    ]);
  });
});
