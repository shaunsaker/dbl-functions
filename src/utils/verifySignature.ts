import * as crypto from 'crypto';

export const verifySignature = (
  secret: string,
  body: Uint8Array,
  signature: string,
) => {
  const computedSignature = crypto
    .createHmac('SHA256', secret)
    .update(new Buffer(JSON.stringify(body), 'utf8'))
    .digest('base64');

  return computedSignature === signature;
};
