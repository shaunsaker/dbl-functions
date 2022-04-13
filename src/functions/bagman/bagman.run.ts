import { runBagman } from '.';
import { makeBtcPayServerInvoiceReceivedPaymentEventData } from '../../services/btcPayServer/data';

require('dotenv').config();

const doAsync = async () => {
  const storeId = process.argv[2];
  const invoiceId = process.argv[3];
  const value = process.argv[4];
  const webhookEvent = makeBtcPayServerInvoiceReceivedPaymentEventData({
    storeId,
    invoiceId,
    value: parseFloat(value),
  });
  try {
    const response = await runBagman(webhookEvent);

    console.log(JSON.stringify({ response }, undefined, 2));
  } catch (error) {
    console.log(error);
  }
};

doAsync();
