import { Request } from 'firebase-functions/v1';
import { verifySignature } from '../services/btcPayServer/verifySignature';
import { FirebaseFunctionResponse } from '../services/firebase/models';

type Response = FirebaseFunctionResponse<void>;

export const verifyWebhookSignature = (request: Request): Response => {
  const signature = request.get('BTCPay-Sig');

  if (!signature) {
    const message = 'signature missing fool.';

    console.log(`verifyWebhookSignature: ${message}`);

    return {
      error: true,
      message,
    };
  }

  const isValidSignature = verifySignature({
    secret: process.env.WEBHOOK_SECRET,
    body: request.body,
    signature,
  });

  if (!isValidSignature) {
    const message = 'signature invalid fool.';

    console.log(`verifyWebhookSignature: ${message}`);

    return {
      error: true,
      message,
    };
  }

  return {
    error: false,
    message: 'great success!',
  };
};
