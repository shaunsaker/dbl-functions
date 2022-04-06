import { encrypt } from '../../utils/crypto';

export const encryptBlockchainAddressPrivateKey = ({
  key,
  address,
  secret,
}: {
  key: string;
  address: string;
  secret: string;
}) => {
  const secretKey = `${secret}${address}`.substring(0, 32);

  return encrypt(key, secretKey);
};
