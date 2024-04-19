// firebaseAdmin.ts

import admin from 'firebase-admin';
import serviceAccount from "../serviceAccount.json" 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://binarybytes.appspot.com'
});

// Export the initialized admin SDK
export const fbAdmin = admin;

// Export the storage bucket if you're planning to use Firebase Storage
export const storageBucket = admin.storage().bucket();

export const auth = admin.auth();
