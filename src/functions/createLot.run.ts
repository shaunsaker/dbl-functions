import { createLot } from './createLot';

const doAsync = async () => {
  const lotId = process.argv[2];
  const active = Boolean(parseInt(process.argv[3]));
  const dryRun = true;

  try {
    await createLot({ lotId, active, dryRun });
  } catch (error) {
    console.log('createLot.run: ', (error as Error).message);
  }
};

doAsync();
