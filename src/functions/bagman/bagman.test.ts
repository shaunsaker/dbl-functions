import { BagmanResponse, runBagman } from '.';
import { makeBtcPayServerInvoiceReceivedPaymentEventData } from '../../services/btcPayServer/data';
import { getUuid } from '../../utils/getUuid';

// TODO: SS find a smart way to mock dependencies (maybe globally?)
// TODO: SS mock firebase-admin
// TODO: SS mock e.g. getInvoice
describe('bagman', () => {
  // it('returns an error when there is no storeId', async () => {
  //   const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
  //     invoiceId: getUuid(),
  //     value: 10,
  //     // @ts-expect-error we want to test bad data
  //     storeId: undefined,
  //   });
  //   const response = await runBagman(eventData);

  //   const expectedResponse: BagmanResponse = {
  //     error: true,
  //     message: 'storeId missing fool.',
  //   };
  //   expect(response).toEqual(expectedResponse);
  // });

  // it('returns an error when there is no invoiceId', async () => {
  //   const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
  //     storeId: getUuid(),
  //     value: 10,
  //     // @ts-expect-error we want to test bad data
  //     invoiceId: undefined,
  //   });
  //   const response = await runBagman(eventData);

  //   const expectedResponse: BagmanResponse = {
  //     error: true,
  //     message: 'invoiceId missing fool.',
  //   };
  //   expect(response).toEqual(expectedResponse);
  // });

  it('returns an error when there is no matching invoice', async () => {
    const eventData = makeBtcPayServerInvoiceReceivedPaymentEventData({
      storeId: getUuid(),
      invoiceId: getUuid(),
      value: 10,
    });
    const response = await runBagman(eventData);

    const expectedResponse: BagmanResponse = {
      error: true,
      message: 'Invoice missing fool.',
    };
    expect(response).toEqual(expectedResponse);
  });

  //   it('returns an error when there is no lotId in the invoice', () => {});

  //   it('returns an error when there is no uid in the invoice', () => {});

  //   it('returns an error when there is no matching lot', () => {});

  //   it('handles exact payment', () => {});

  //   it('handles partial payment', () => {});

  //   it('handles over payment', () => {});
});
