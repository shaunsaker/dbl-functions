import { testSendBTCFromAddress } from './testSendBTCFromAddress';

require('dotenv').config();

const doAsync = async () => {
  const inputAddress = process.argv[2];
  const inputAddressPrivateKey = process.argv[3];
  const outputAddress = process.argv[4];
  const BTCValue = parseFloat(process.argv[5]);

  const tx = await testSendBTCFromAddress({
    inputAddress,
    inputAddressPrivateKey,
    outputAddress,
    BTCValue,
  });

  console.log(JSON.stringify(tx, null, 2));
};

doAsync();
