import { makeInvoice } from '../lots/data';
import { getUuid } from '../utils/getUuid';
import { setupValidateWebhookEventDataTest } from './validateWebhookEventData.testUtils';

describe('validateWebhookEventData', () => {
  it('returns an error when there is no storeId', async () => {
    const { response } = await setupValidateWebhookEventDataTest({
      storeId: '',
    });

    expect(response).toEqual({
      error: true,
      message: 'storeId missing fool.',
    });
  });

  it('returns an error when there is no invoiceId', async () => {
    const { response } = await setupValidateWebhookEventDataTest({
      storeId: getUuid(),
      invoiceId: '',
    });

    expect(response).toEqual({
      error: true,
      message: 'invoiceId missing fool.',
    });
  });

  it('returns an error when there is no matching invoice', async () => {
    const { response } = await setupValidateWebhookEventDataTest({
      storeId: getUuid(),
      invoiceId: getUuid(),
      invoice: null,
    });

    expect(response).toEqual({
      error: true,
      message: 'invoice missing fool.',
    });
  });

  it('returns an error when there is no lotId in the invoice', async () => {
    const invoice = makeInvoice({
      metadata: { lotId: '', uid: getUuid(), ticketIds: [getUuid()] },
    });
    const { response } = await setupValidateWebhookEventDataTest({ invoice });

    expect(response).toEqual({
      error: true,
      message: 'lotId missing from invoice fool.',
    });
  });

  it('returns an error when there is no uid in the invoice', async () => {
    const invoice = makeInvoice({
      metadata: { lotId: getUuid(), uid: '', ticketIds: [getUuid()] },
    });
    const { response } = await setupValidateWebhookEventDataTest({ invoice });

    expect(response).toEqual({
      error: true,
      message: 'uid missing from invoice fool.',
    });
  });

  it('returns an error when there are no ticketIds in the invoice', async () => {
    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        // @ts-expect-error mocked
        ticketIds: null,
      },
    });
    const { response } = await setupValidateWebhookEventDataTest({ invoice });

    expect(response).toEqual({
      error: true,
      message: 'ticketIds missing from invoice fool.',
    });
  });

  it('returns an error when there the ticketIds in the invoice are empty', async () => {
    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        ticketIds: [],
      },
    });
    const { response } = await setupValidateWebhookEventDataTest({ invoice });

    expect(response).toEqual({
      error: true,
      message: 'ticketIds in invoice are empty fool.',
    });
  });

  it('returns the invoice', async () => {
    const invoice = makeInvoice({
      metadata: {
        lotId: getUuid(),
        uid: getUuid(),
        ticketIds: [getUuid()],
      },
    });
    const { response } = await setupValidateWebhookEventDataTest({ invoice });

    expect(response).toEqual({
      error: false,
      message: 'great success!',
      data: invoice,
    });
  });
});
