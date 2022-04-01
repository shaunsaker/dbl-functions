export const numberToDigits = (value: number, digits = 2): number =>
  parseFloat(value.toFixed(digits));
