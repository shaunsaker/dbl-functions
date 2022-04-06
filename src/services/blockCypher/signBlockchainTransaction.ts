import { script } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { TXSkeleton } from './models';

const ECPair = ECPairFactory(ecc);

export const signBlockchainTransaction = async ({
  txSkeleton,
  privateKey,
}: {
  txSkeleton: TXSkeleton;
  privateKey: string;
}) => {
  const keyBuffer = Buffer.from(privateKey, 'hex'); // we may need to convert the privateKey to hex
  const keys = ECPair.fromPrivateKey(keyBuffer);

  const publicKeys: string[] = txSkeleton.tosign.map(() => {
    return keys.publicKey.toString('hex');
  });

  const signatures: string[] = txSkeleton.tosign.map((tosign) => {
    return script.signature
      .encode(keys.sign(Buffer.from(tosign, 'hex')), 0x01)
      .toString('hex')
      .slice(0, -2);
  });

  const newTx: TXSkeleton = {
    ...txSkeleton,
    pubkeys: publicKeys,
    signatures,
  };

  return newTx;
};
