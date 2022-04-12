import { runBookie } from '.';

require('dotenv').config();

const doAsync = async () => {
  const response = await runBookie({
    uid: process.argv[2] || 'ahAMQUnPjjQIMffdqR92rkQ4YEy2',
    lotId: process.argv[3] || '2022-04-12',
    ticketCount: parseInt(process.argv[4]) || 5,
  });

  console.log(JSON.stringify({ response }, undefined, 2));
};

doAsync();
