import * as bip39 from 'bip39';

export const createMnemonic = (): string => {
  const mnemonic = bip39.generateMnemonic();

  return mnemonic;
};
