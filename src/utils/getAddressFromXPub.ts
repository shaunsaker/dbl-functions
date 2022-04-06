import { networks, payments } from 'bitcoinjs-lib';
import { bip32 } from './bip32';

const testnet = networks.testnet;

const getAddress = (node: any, network: any) => {
  const thing = payments.p2sh({
    redeem: payments.p2wpkh({ pubkey: node.publicKey, network }),
    network,
  });

  return thing.address;
};

export const getAddressFromXpub = (
  xPub: string,
  index: number,
): string | undefined => {
  const webRoot = bip32.fromBase58(xPub, testnet);
  const child = webRoot.derive(0).derive(index);
  const address = getAddress(child, testnet);

  return address;
};
