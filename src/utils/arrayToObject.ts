// FIXME: type this correctly
export const arrayToObject = (
  array: Record<string, any>[],
  idKey?: string,
): Record<string, any> => {
  const object: Record<string, any> = {};

  array.forEach((item) => {
    object[item[idKey || 'id']] = item;
  });

  return object;
};
