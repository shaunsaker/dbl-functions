import * as firebase from 'firebase-admin';

const serviceAccount = require('./service-account.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

export { firebase };
