export const maybePluralise = (count: number, string: string): string =>
  `${count} ${string}${count === 0 || count > 1 ? "'s" : ''}`;
