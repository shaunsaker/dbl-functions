import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getTimeAsISOString } from '../../utils/getTimeAsISOString';

const client = new admin.firestore.v1.FirestoreAdminClient();
const env = functions.config();

export const runBookKeeper = async () => {
  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;

  if (!projectId) {
    return;
  }

  const databaseName = client.databasePath(projectId, '(default)');
  const timestamp = getTimeAsISOString();
  const dest = `gs://${env.backup.bucket_name}/firestore/${timestamp}`;

  try {
    const responses = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: dest,
      collectionIds: [], // leave empty to export all collections.
    });

    const response = responses[0];

    console.log(`Operation Name: ${response['name']}`);
  } catch (error) {
    console.error(error);

    throw new Error('export operation failed.');
  }
};

export const bookKeeper = functions
  .region('europe-west1')
  .pubsub.schedule('0 1 * * *') // every day at 1am
  .timeZone('Africa/Johannesburg')
  .onRun(async () => {
    await runBookKeeper();
  });
