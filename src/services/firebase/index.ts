import * as firebase from 'firebase-admin';

// adds compatibility for console.log
require('firebase-functions/lib/logger/compat');

const serviceAccount = require('./service-account.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

export { firebase };
