export const objectToArray = <T>(object: Record<string, T>): T[] =>
  Object.keys(object).map((key) => ({
    ...object[key],
  }));
