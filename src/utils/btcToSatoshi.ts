export const btcToSatoshi = (btc: number): number =>
  Math.round(btc * 100000000);
