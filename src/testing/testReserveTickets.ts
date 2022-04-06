import { runReserveTickets } from '../functions/reserveTickets';

const doAsync = async () => {
  const response = await runReserveTickets({
    uid: process.argv[2],
    lotId: process.argv[3],
    ticketCount: parseInt(process.argv[4]),
  });

  console.log(JSON.stringify({ response }, undefined, 2));
};

doAsync();
