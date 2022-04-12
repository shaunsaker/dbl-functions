import { runBookie } from '.';

require('dotenv').config();

const doAsync = async () => {
  const response = await runBookie({
    uid: process.argv[2],
    lotId: process.argv[3],
    ticketCount: parseInt(process.argv[4]),
  });

  console.log(JSON.stringify({ response }, undefined, 2));
};

doAsync();
