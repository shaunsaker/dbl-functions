export const selectRandomItemFromArray = <T>(
  items: T[],
  randomNumber: number = Math.random(),
): T | undefined => {
  return items[Math.floor(randomNumber * items.length)];
};
