import * as crypto from 'crypto';

export const verifySignature = ({
  secret,
  body,
  signature,
}: {
  secret: string;
  body: Record<string, any>;
  signature: string;
}) => {
  // create a signature using the same algorithm and secret on the body
  const algorithm = 'sha256';
  const encrypted = crypto
    .createHmac(algorithm, Buffer.from(secret))
    .update(JSON.stringify(body, null, 2)) // we apparently have to indent 🤷‍♂️
    .digest('hex');
  const bodySignature = `${algorithm}=${encrypted}`;

  // check that the created body signature matches the signature
  const checksum = Buffer.from(signature, 'utf-8');
  const digest = Buffer.from(bodySignature);
  const isValid =
    checksum.length === digest.length &&
    crypto.timingSafeEqual(digest, checksum);

  return isValid;
};
