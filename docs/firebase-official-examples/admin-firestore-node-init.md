# Firebase Admin SDK — Cloud Firestore (Node.js) — Official Examples (Exact Copy)

> Source: Get started with Cloud Firestore — Server (Admin SDK)
> https://firebase.google.com/docs/firestore/quickstart
>
> Source: Add data to Cloud Firestore — Server (Admin SDK)
> https://firebase.google.com/docs/firestore/manage-data/add-data

## Initialize on Google environments (Application Default Credentials)

```js
const {
  initializeApp,
  applicationDefault,
  cert,
} = require('firebase-admin/app')
const {
  getFirestore,
  Timestamp,
  FieldValue,
  Filter,
} = require('firebase-admin/firestore')

initializeApp({
  credential: applicationDefault(),
})

const db = getFirestore()
```

## Initialize on your own server (Service Account)

```js
const {
  initializeApp,
  applicationDefault,
  cert,
} = require('firebase-admin/app')
const {
  getFirestore,
  Timestamp,
  FieldValue,
  Filter,
} = require('firebase-admin/firestore')

const serviceAccount = require('./path/to/serviceAccountKey.json')

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()
```
