import { reserveTicketsForUid } from '../src/functions/reserveTickets';

const doAsync = async () => {
  const response = await reserveTicketsForUid({
    uid: process.argv[2],
    lotId: process.argv[3],
    ticketCount: parseInt(process.argv[4]),
    userWalletId: process.argv[5],
  });

  console.log(JSON.stringify({ response }, undefined, 2));
};

doAsync();
