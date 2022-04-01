export const isObjectEmpty = <T>(object: T): boolean =>
  !Object.keys(object).length;
