import { runBangBeggar } from '.';
import { makeBtcPayServerInvoiceExpiredEventData } from '../../services/btcPayServer/data';

require('dotenv').config();

const doAsync = async () => {
  const storeId = process.argv[2];
  const invoiceId = process.argv[3];
  const webhookEvent = makeBtcPayServerInvoiceExpiredEventData({
    storeId,
    invoiceId,
  });

  try {
    const response = await runBangBeggar(webhookEvent);

    console.log(JSON.stringify({ response }, undefined, 2));
  } catch (error) {
    console.log(error);
  }
};

doAsync();
