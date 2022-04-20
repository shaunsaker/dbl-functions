declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      BTC_PAY_SERVER_API_KEY: string;
      BTC_PAY_INSTANCE_URL: string;
      STORE_WALLET_SECRET_KEY: string;
      STORE_MNEMONIC_SECRET_KEY: string;
      WEBHOOK_SECRET: string;
      INVOICE_RECEIVED_PAYMENT_WEBHOOK_URL: string;
      INVOICE_SETTLED_WEBHOOK_URL: string;
      INVOICE_EXPIRED_WEBHOOK_URL: string;
      EMAIL_USERNAME: string;
      EMAIL_PASSWORD: string;
      APP_NAME: string;
      PORT?: string;
      PWD: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
