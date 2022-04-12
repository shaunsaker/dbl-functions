import { runBagman } from '.';
import { makeBtcPayServerInvoicePaymentEventData } from '../../services/btcPayServer/data';

require('dotenv').config();

const doAsync = async () => {
  const storeId =
    process.argv[2] || '7QMytW9UNkWCxvRTDSpvYWCZ3ZFL7hDFLMEcZ57MJNXx';
  const invoiceId = process.argv[3] || '22pQRRYupibbaoXQzFKFBC';
  const value = process.argv[4] || '20.00';
  const invoiceReceivedPaymentEvent = makeBtcPayServerInvoicePaymentEventData({
    storeId,
    invoiceId,
    value,
  });
  try {
    const response = await runBagman(invoiceReceivedPaymentEvent);

    console.log(JSON.stringify({ response }, undefined, 2));
  } catch (error) {
    console.log(error);
  }
};

doAsync();
