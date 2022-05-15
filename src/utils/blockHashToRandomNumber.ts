export const blockHashToRandomNumber = (hash: string): number => {
  return parseInt(hash, 16) / Math.pow(2, 256);
};
