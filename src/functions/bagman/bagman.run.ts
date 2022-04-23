import { runBagman } from '.';
import { makeBtcPayServerInvoiceReceivedPaymentEventData } from '../../services/btcPayServer/data';
import { getStoreByStoreName } from '../../services/btcPayServer/getStoreByStoreName';

const doAsync = async () => {
  // get the store id using the name
  const storeName = process.argv[2];
  const store = await getStoreByStoreName(storeName);

  if (!store) {
    console.log('Could not find store with name', storeName);

    return;
  }

  const invoiceId = process.argv[3];
  const value = process.argv[4];
  const webhookEvent = makeBtcPayServerInvoiceReceivedPaymentEventData({
    storeId: store.id,
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
