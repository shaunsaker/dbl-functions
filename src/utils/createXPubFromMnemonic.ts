import { networks } from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { bip32 } from './bip32';

require('dotenv').config();

const testnet = networks.testnet;

export const createXPubFromMnemonic = (mnemonic: string): string => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, testnet);

  const accountpath = `m/49'/${
    process.env.NODE_ENV === 'development' ? 1 : 0
  }'/0'`; // 1' is testnet, change to 0' for mainnet
  const account = root.derivePath(accountpath);
  const accountXPub = account.neutered().toBase58(); // testnet is tpub not xpub

  return accountXPub;
};
