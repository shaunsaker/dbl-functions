declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      BLOCK_CYPHER_TOKEN: string;
      BLOCK_CYPHER_API: string;
      DEPOSIT_CALLBACK_URL: string;
      WEBHOOK_SIGNING_KEY: string;
      LOT_ADDRESS_SECRET: string;
      USERS_ADDRESS_SECRET: string;
      PORT?: string;
      PWD: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
